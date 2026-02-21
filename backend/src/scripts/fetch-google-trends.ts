/**
 * Google Trends Daily Fetch Script
 *
 * Fetches Google Trends data for tracked ingredients and stores in database.
 * Designed to run automatically via cron job at 1 AM UTC daily.
 *
 * Cron configuration:
 *   0 1 * * * cd /path/to/kitvas/backend && npm run trends:daily
 *
 * Usage:
 *   npm run trends:daily
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { GoogleTrendsFetcher } from '../lib/google-trends/index.js';
import { sendBreakoutAlert } from '../lib/email/resend.js';

config();

const prisma = new PrismaClient();

interface JobStats {
  startTime: Date;
  keywordsIdentified: number;
  keywordsFetched: number;
  keywordsCached: number;
  relatedQueriesDiscovered: number;
  breakoutsFound: string[];
  errors: number;
}

async function logJobStart(): Promise<string> {
  const log = await prisma.googleTrendsJobLog.create({
    data: {
      jobType: 'daily_fetch',
      status: 'started',
    },
  });
  return log.id;
}

async function logJobComplete(
  jobId: string,
  stats: JobStats,
  status: 'completed' | 'failed',
  errorMessage?: string
): Promise<void> {
  const duration = Math.round((Date.now() - stats.startTime.getTime()) / 1000);

  await prisma.googleTrendsJobLog.update({
    where: { id: jobId },
    data: {
      status,
      keywordCount: stats.keywordsFetched,
      duration,
      errorMessage,
    },
  });
}

async function runTrendsFetch(): Promise<void> {
  const stats: JobStats = {
    startTime: new Date(),
    keywordsIdentified: 0,
    keywordsFetched: 0,
    keywordsCached: 0,
    relatedQueriesDiscovered: 0,
    breakoutsFound: [],
    errors: 0,
  };

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 Google Trends Daily Fetch');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Started at: ${stats.startTime.toISOString()}\n`);

  const jobId = await logJobStart();
  const fetcher = new GoogleTrendsFetcher(prisma, { cacheTtlHours: 1 });

  try {
    // Step 1: Identify keywords to track
    console.log('📋 Step 1: Identifying keywords to track...');
    const keywords = await fetcher.getKeywordsToTrack(50);
    stats.keywordsIdentified = keywords.length;
    console.log(`   Found ${keywords.length} keywords to track`);
    console.log(`   Sample: ${keywords.slice(0, 5).join(', ')}...\n`);

    // Step 2: Fetch trends data (with rate limiting)
    console.log('📈 Step 2: Fetching Google Trends data...');
    const fetchResult = await fetcher.fetchAndStoreKeywords(keywords, (completed, total, keyword) => {
      const percent = Math.round((completed / total) * 100);
      process.stdout.write(`\r   Progress: ${completed}/${total} (${percent}%) - ${keyword}                    `);
    });

    stats.keywordsFetched = fetchResult.fetched;
    stats.keywordsCached = fetchResult.cached;
    stats.errors = fetchResult.errors;
    stats.breakoutsFound = fetchResult.breakouts;

    console.log('\n');
    console.log(`   Fetched: ${fetchResult.fetched}`);
    console.log(`   Cached (skipped): ${fetchResult.cached}`);
    console.log(`   Errors: ${fetchResult.errors}\n`);

    // Step 3: Discover new trending ingredients
    console.log('🔍 Step 3: Discovering trending ingredients from related queries...');
    const discoveries = await fetcher.discoverTrendingIngredients();
    stats.relatedQueriesDiscovered = discoveries.length;
    console.log(`   Discovered ${discoveries.length} related queries`);
    if (discoveries.length > 0) {
      console.log(`   Top discoveries: ${discoveries.slice(0, 5).join(', ')}\n`);
    }

    // Step 4: Report breakouts and send email alerts
    if (stats.breakoutsFound.length > 0) {
      console.log('🔥 BREAKOUT TRENDS DETECTED:');
      for (const keyword of stats.breakoutsFound) {
        console.log(`   - ${keyword}`);
      }
      console.log('');

      // Send email alerts to subscribed users
      await sendBreakoutAlerts(stats.breakoutsFound);
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✨ Trends Fetch Complete');
    console.log('═══════════════════════════════════════════════════════════');

    const duration = Math.round((Date.now() - stats.startTime.getTime()) / 1000);
    console.log(`Duration: ${duration}s`);
    console.log(`Keywords tracked: ${stats.keywordsFetched}/${stats.keywordsIdentified}`);
    console.log(`Related queries discovered: ${stats.relatedQueriesDiscovered}`);
    console.log(`Breakout trends: ${stats.breakoutsFound.length}`);
    console.log(`Errors: ${stats.errors}`);

    await logJobComplete(jobId, stats, 'completed');

    // Notify connected SSE clients of new data
    await triggerBroadcast();
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logJobComplete(jobId, stats, 'failed', errorMessage);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function sendBreakoutAlerts(ingredients: string[]): Promise<void> {
  try {
    // Find users with alerts enabled
    const subscribers = await prisma.alertSubscription.findMany({
      where: { enabled: true },
      include: { user: { select: { email: true, id: true } } },
    });

    if (subscribers.length === 0) {
      console.log('📧 No alert subscribers — skipping email alerts');
      return;
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let sentCount = 0;

    for (const sub of subscribers) {
      // Check if we already sent an alert for these ingredients in the last 24h
      const recentAlert = await prisma.sentAlert.findFirst({
        where: {
          userId: sub.user.id,
          sentAt: { gte: twentyFourHoursAgo },
          ingredients: { hasSome: ingredients },
        },
      });

      if (recentAlert) continue;

      const success = await sendBreakoutAlert(sub.user.email, ingredients);
      if (success) {
        await prisma.sentAlert.create({
          data: { userId: sub.user.id, ingredients },
        });
        sentCount++;
      }
    }

    console.log(`📧 Sent breakout alerts to ${sentCount}/${subscribers.length} subscriber(s)`);
  } catch (error) {
    console.error('⚠️  Failed to send breakout alerts:', error);
  }
}

async function triggerBroadcast(): Promise<void> {
  const url = process.env.INTERNAL_BROADCAST_URL || 'http://localhost:4001/internal/broadcast-trends';
  const secret = process.env.INTERNAL_BROADCAST_SECRET;
  if (!secret) {
    console.log('\n⚠️  INTERNAL_BROADCAST_SECRET not set — skipping SSE broadcast');
    return;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'X-Internal-Secret': secret },
    });
    if (res.ok) {
      const body = await res.json() as { connections: number };
      console.log(`📡 SSE broadcast sent to ${body.connections} client(s)`);
    } else {
      console.warn(`⚠️  Broadcast failed: ${res.status}`);
    }
  } catch {
    // Server may be down — non-fatal
    console.warn('⚠️  Could not reach server for SSE broadcast');
  }
}

// Run the script
runTrendsFetch();
