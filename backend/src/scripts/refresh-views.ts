/**
 * Refresh Video View Counts
 *
 * Fetches updated view counts from YouTube API for videos with stale data.
 * YouTube's videos.list endpoint allows 50 IDs per call (1 quota unit each).
 *
 * Usage:
 *   npx tsx src/scripts/refresh-views.ts
 *   npx tsx src/scripts/refresh-views.ts --max 200
 *   npx tsx src/scripts/refresh-views.ts --days 14
 *
 * For cron/scheduled tasks:
 *   # Run weekly on Sundays at 3 AM
 *   0 3 * * 0 cd /path/to/kitvas/backend && npx tsx src/scripts/refresh-views.ts
 */

import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';
import { getVideoDetails } from '../lib/youtube.js';

const prisma = new PrismaClient();

interface RefreshStats {
  videosChecked: number;
  videosUpdated: number;
  videosMissing: number;
  apiCalls: number;
}

async function refreshViews(maxVideos: number, staleDays: number): Promise<void> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('[RefreshViews] YOUTUBE_API_KEY not configured');
    process.exit(1);
  }

  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - staleDays);

  // Find videos with stale or missing view data
  const staleVideos = await prisma.video.findMany({
    where: {
      OR: [
        { viewsUpdatedAt: null },
        { viewsUpdatedAt: { lt: staleDate } },
      ],
    },
    select: {
      id: true,
      youtubeId: true,
      views: true,
    },
    orderBy: { viewsUpdatedAt: { sort: 'asc', nulls: 'first' } },
    take: maxVideos,
  });

  if (staleVideos.length === 0) {
    console.log('[RefreshViews] No stale videos found');
    return;
  }

  console.log(`[RefreshViews] Found ${staleVideos.length} videos to refresh`);

  const stats: RefreshStats = {
    videosChecked: staleVideos.length,
    videosUpdated: 0,
    videosMissing: 0,
    apiCalls: 0,
  };

  // Process in batches of 50 (YouTube API limit per call)
  const BATCH_SIZE = 50;
  for (let i = 0; i < staleVideos.length; i += BATCH_SIZE) {
    const batch = staleVideos.slice(i, i + BATCH_SIZE);
    const youtubeIds = batch.map(v => v.youtubeId);

    try {
      const videoDetails = await getVideoDetails(youtubeIds, apiKey);
      stats.apiCalls++;

      // Build lookup map from YouTube response
      const viewsMap = new Map<string, number>();
      for (const detail of videoDetails) {
        const views = detail.statistics?.viewCount
          ? parseInt(detail.statistics.viewCount, 10)
          : null;
        if (views !== null) {
          viewsMap.set(detail.id, views);
        }
      }

      // Update each video in database
      for (const video of batch) {
        const newViews = viewsMap.get(video.youtubeId);
        if (newViews !== undefined) {
          await prisma.video.update({
            where: { id: video.id },
            data: {
              views: newViews,
              viewsUpdatedAt: new Date(),
            },
          });
          stats.videosUpdated++;

          if (video.views !== null && newViews !== video.views) {
            const diff = newViews - video.views;
            const sign = diff > 0 ? '+' : '';
            console.log(`  ${video.youtubeId}: ${video.views} → ${newViews} (${sign}${diff})`);
          }
        } else {
          // Video may have been deleted from YouTube
          stats.videosMissing++;
          await prisma.video.update({
            where: { id: video.id },
            data: { viewsUpdatedAt: new Date() },
          });
        }
      }

      console.log(`[RefreshViews] Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} videos processed`);
    } catch (error) {
      console.error(`[RefreshViews] API error on batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
    }

    // Brief pause between batches to be nice to the API
    if (i + BATCH_SIZE < staleVideos.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n[RefreshViews] Complete:');
  console.log(`  Videos checked:  ${stats.videosChecked}`);
  console.log(`  Videos updated:  ${stats.videosUpdated}`);
  console.log(`  Videos missing:  ${stats.videosMissing}`);
  console.log(`  API calls used:  ${stats.apiCalls}`);
}

// Parse CLI arguments
const args = process.argv.slice(2);
let maxVideos = 500;
let staleDays = 7;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--max' && args[i + 1]) {
    maxVideos = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--days' && args[i + 1]) {
    staleDays = parseInt(args[i + 1], 10);
    i++;
  }
}

console.log(`[RefreshViews] Refreshing up to ${maxVideos} videos stale for ${staleDays}+ days`);

refreshViews(maxVideos, staleDays)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
