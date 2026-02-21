/**
 * Cross-Platform Trend Aggregation
 *
 * Aggregates trending food topics from all sources (YouTube, Web)
 * into the TrendingTopic model for the dashboard overview.
 *
 * Scoring formula:
 * - YouTube views weight: 0.65
 * - Web articles weight: 0.35
 *
 * Schedule: Every 15 minutes
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config({ path: '.env' });

const prisma = new PrismaClient();

const PERIODS = ['1h', '24h', '7d', '30d'] as const;

function periodToMs(period: string): number {
  switch (period) {
    case '1h': return 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

interface TopicCounts {
  youtubeCount: number;
  youtubeViews: number;
  webCount: number;
}

async function aggregateTrendingTopics() {
  console.log('[Aggregate] Starting cross-platform trend aggregation...');
  const startTime = Date.now();

  for (const period of PERIODS) {
    const since = new Date(Date.now() - periodToMs(period));
    console.log(`[Aggregate] Processing period: ${period} (since ${since.toISOString()})`);

    // Collect ingredient mentions from all sources
    const topicMap = new Map<string, TopicCounts>();

    function getOrCreate(topic: string): TopicCounts {
      const normalized = topic.toLowerCase().trim();
      if (!topicMap.has(normalized)) {
        topicMap.set(normalized, {
          youtubeCount: 0, youtubeViews: 0,
          webCount: 0,
        });
      }
      return topicMap.get(normalized)!;
    }

    // 1. YouTube: Count ingredient mentions in recent videos
    const recentVideos = await prisma.video.findMany({
      where: {
        publishedAt: { gte: since },
        views: { not: null },
      },
      include: {
        videoIngredients: {
          where: { confidence: { gte: 0.5 } },
          include: { ingredient: true },
        },
      },
    });

    for (const video of recentVideos) {
      for (const vi of video.videoIngredients) {
        const counts = getOrCreate(vi.ingredient.name);
        counts.youtubeCount++;
        counts.youtubeViews += video.views || 0;
      }
    }

    // 2. Web: Count ingredient mentions in recent articles
    const recentArticles = await prisma.webArticle.findMany({
      where: { publishedAt: { gte: since } },
    });

    for (const article of recentArticles) {
      for (const ingredient of article.ingredients) {
        const counts = getOrCreate(ingredient);
        counts.webCount++;
      }
    }

    // Calculate trend scores and upsert
    const maxYtViews = Math.max(...Array.from(topicMap.values()).map(c => c.youtubeViews), 1);
    const maxWebCount = Math.max(...Array.from(topicMap.values()).map(c => c.webCount), 1);

    let upsertCount = 0;

    for (const [topic, counts] of topicMap.entries()) {
      const mentionCount = counts.youtubeCount + counts.webCount;
      if (mentionCount < 2) continue; // Skip topics with very few mentions

      // Normalized weighted score (0-100)
      const ytScore = (counts.youtubeViews / maxYtViews) * 100 * 0.65;
      const webScoreNorm = (counts.webCount / maxWebCount) * 100 * 0.35;
      const trendScore = Math.min(100, ytScore + webScoreNorm);

      // Determine active sources
      const sources: string[] = [];
      if (counts.youtubeCount > 0) sources.push('youtube');
      if (counts.webCount > 0) sources.push('web');

      // Breakout: appears on both platforms or very high score
      const isBreakout = sources.length >= 2 || trendScore > 80;

      try {
        // Calculate growth by comparing to previous period
        const prevPeriodStart = new Date(since.getTime() - periodToMs(period));
        const previousTopic = await prisma.trendingTopic.findUnique({
          where: { topic_period: { topic, period } },
          select: { trendScore: true },
        });

        const growthPct = previousTopic
          ? ((trendScore - previousTopic.trendScore) / (previousTopic.trendScore || 1)) * 100
          : null;

        await prisma.trendingTopic.upsert({
          where: { topic_period: { topic, period } },
          update: {
            trendScore,
            sources,
            mentionCount,
            youtubeCount: counts.youtubeCount,
            webCount: counts.webCount,
            growthPct,
            isBreakout,
          },
          create: {
            topic,
            period,
            trendScore,
            sources,
            mentionCount,
            youtubeCount: counts.youtubeCount,
            webCount: counts.webCount,
            growthPct,
            isBreakout,
          },
        });
        upsertCount++;
      } catch (error) {
        console.error(`[Aggregate] Error upserting topic "${topic}":`, error);
      }
    }

    console.log(`[Aggregate] Period ${period}: ${upsertCount} topics aggregated from ${topicMap.size} unique ingredients`);
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log(`[Aggregate] Done in ${duration}s`);
}

aggregateTrendingTopics()
  .catch(err => {
    console.error('[Aggregate] Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
