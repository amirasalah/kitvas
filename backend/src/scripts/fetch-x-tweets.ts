/**
 * X/Twitter Food Tweets Fetcher
 *
 * Searches for food-related tweets using hashtags and trending ingredient names.
 * Extracts ingredients from tweet text.
 * Schedule: Every hour
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { fetchAllFoodTweets } from '../lib/x-twitter.js';
import { extractIngredientsWithKeywords } from '../lib/ingredient-extractor.js';

config({ path: '.env' });

const prisma = new PrismaClient();

async function fetchXTweets() {
  console.log('[X] Starting X/Twitter food tweets fetch...');
  const startTime = Date.now();

  if (!process.env.X_BEARER_TOKEN) {
    console.warn('[X] X_BEARER_TOKEN not set, skipping');
    return;
  }

  let totalNew = 0;

  try {
    // Get trending ingredients for dynamic queries
    const trendingIngredients = await prisma.googleTrend.findMany({
      where: {
        date: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        interestValue: { gte: 60 },
      },
      distinct: ['keyword'],
      orderBy: { interestValue: 'desc' },
      take: 5,
      select: { keyword: true },
    });

    const extraQueries = trendingIngredients.map(
      t => `${t.keyword} recipe -is:retweet`
    );

    const tweets = await fetchAllFoodTweets(extraQueries);
    console.log(`[X] Fetched ${tweets.length} tweets`);

    for (const tweet of tweets) {
      try {
        // Extract ingredients from tweet text
        const ingredients = extractIngredientsWithKeywords(tweet.text, '');

        await prisma.tweet.upsert({
          where: { tweetId: tweet.tweetId },
          update: {
            likeCount: tweet.likeCount,
            retweetCount: tweet.retweetCount,
            replyCount: tweet.replyCount,
            quoteCount: tweet.quoteCount,
            impressionCount: tweet.impressionCount,
            fetchedAt: new Date(),
          },
          create: {
            tweetId: tweet.tweetId,
            authorUsername: tweet.authorUsername,
            authorName: tweet.authorName,
            text: tweet.text,
            likeCount: tweet.likeCount,
            retweetCount: tweet.retweetCount,
            replyCount: tweet.replyCount,
            quoteCount: tweet.quoteCount,
            impressionCount: tweet.impressionCount,
            hashtags: tweet.hashtags,
            ingredients: ingredients.map(i => i.name),
            mediaUrl: tweet.mediaUrl,
            createdAt: tweet.createdAt,
          },
        });
        totalNew++;
      } catch (error: any) {
        if (error?.code === 'P2002') continue;
        console.error(`[X] Error processing tweet ${tweet.tweetId}:`, error);
      }
    }

    // Update platform status
    await prisma.platformSource.upsert({
      where: { platform: 'x' },
      update: {
        lastFetchedAt: new Date(),
        lastStatus: 'success',
        itemsFetched: totalNew,
        errorMessage: null,
      },
      create: {
        platform: 'x',
        lastFetchedAt: new Date(),
        lastStatus: 'success',
        itemsFetched: totalNew,
      },
    });
  } catch (error: any) {
    console.error('[X] Fatal error:', error);
    await prisma.platformSource.upsert({
      where: { platform: 'x' },
      update: {
        lastFetchedAt: new Date(),
        lastStatus: 'error',
        errorMessage: error.message,
      },
      create: {
        platform: 'x',
        lastFetchedAt: new Date(),
        lastStatus: 'error',
        errorMessage: error.message,
      },
    });
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log(`[X] Done in ${duration}s. New/Updated: ${totalNew}`);
}

fetchXTweets()
  .catch(err => {
    console.error('[X] Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
