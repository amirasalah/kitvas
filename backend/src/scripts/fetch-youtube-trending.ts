/**
 * YouTube Trending Food Videos Fetcher
 *
 * Searches YouTube for trending food content using:
 * - Trending food queries ("trending recipe", "viral food", etc.)
 * - Top trending ingredients from Google Trends data
 *
 * Stores videos in the existing Video model with extracted ingredients.
 * Schedule: Every 2 hours
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { searchYouTubeVideos, getVideoDetails } from '../lib/youtube.js';
import { extractIngredientsFromVideo, storeExtractedIngredients } from '../lib/ingredient-extractor.js';

config({ path: '.env' });

const prisma = new PrismaClient();

const TRENDING_QUERIES = [
  'trending recipe this week',
  'viral food recipe',
  'food trend 2026',
  'popular recipe right now',
  'best new recipe',
];

async function fetchYouTubeTrending() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('[YT-Trending] YOUTUBE_API_KEY not set');
    process.exit(1);
  }

  console.log('[YT-Trending] Starting YouTube trending fetch...');
  const startTime = Date.now();
  let totalFetched = 0;
  let totalNew = 0;

  // Get top trending ingredients from Google Trends for dynamic queries
  const trendingIngredients = await prisma.googleTrend.findMany({
    where: {
      date: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      interestValue: { gte: 50 },
    },
    distinct: ['keyword'],
    orderBy: { interestValue: 'desc' },
    take: 15,
    select: { keyword: true },
  });

  const ingredientQueries = trendingIngredients.map(
    t => `${t.keyword} recipe trending`
  );

  const allQueries = [...TRENDING_QUERIES, ...ingredientQueries];
  console.log(`[YT-Trending] Running ${allQueries.length} queries`);

  for (const query of allQueries) {
    try {
      const searchResults = await searchYouTubeVideos(query, apiKey, 10);
      if (searchResults.length === 0) continue;

      const videoIds = searchResults.map(r => r.id.videoId);
      const videoDetails = await getVideoDetails(videoIds, apiKey);
      totalFetched += videoDetails.length;

      for (const ytVideo of videoDetails) {
        try {
          const existing = await prisma.video.findUnique({
            where: { youtubeId: ytVideo.id },
          });
          if (existing) continue;

          const dbVideo = await prisma.video.create({
            data: {
              youtubeId: ytVideo.id,
              title: ytVideo.snippet.title,
              description: ytVideo.snippet.description || null,
              thumbnailUrl:
                ytVideo.snippet.thumbnails.high?.url ||
                ytVideo.snippet.thumbnails.medium?.url ||
                ytVideo.snippet.thumbnails.default.url,
              publishedAt: new Date(ytVideo.snippet.publishedAt),
              views: ytVideo.statistics?.viewCount
                ? parseInt(ytVideo.statistics.viewCount, 10)
                : null,
              viewsUpdatedAt: new Date(),
              channelId: ytVideo.snippet.channelId || null,
              extractedAt: new Date(),
            },
          });

          // Extract ingredients
          const ingredients = await extractIngredientsFromVideo(
            ytVideo.snippet.title,
            ytVideo.snippet.description || null,
            null
          );
          if (ingredients.length > 0) {
            await storeExtractedIngredients(prisma, dbVideo.id, ingredients);
          }

          totalNew++;
        } catch (error: any) {
          if (error?.code === 'P2002') continue; // Duplicate, skip
          console.error(`[YT-Trending] Error processing ${ytVideo.id}:`, error);
        }
      }

      // Small delay between queries
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      console.error(`[YT-Trending] Query "${query}" failed:`, error);
    }
  }

  // Update platform source status
  await prisma.platformSource.upsert({
    where: { platform: 'youtube' },
    update: {
      lastFetchedAt: new Date(),
      lastStatus: 'success',
      itemsFetched: totalNew,
      errorMessage: null,
    },
    create: {
      platform: 'youtube',
      lastFetchedAt: new Date(),
      lastStatus: 'success',
      itemsFetched: totalNew,
    },
  });

  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log(`[YT-Trending] Done in ${duration}s. Fetched: ${totalFetched}, New: ${totalNew}`);
}

fetchYouTubeTrending()
  .catch(err => {
    console.error('[YT-Trending] Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
