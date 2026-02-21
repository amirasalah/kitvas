/**
 * Reddit Food Posts Fetcher
 *
 * Fetches hot posts from monitored food subreddits.
 * Extracts ingredients from post titles.
 * Schedule: Every 30 minutes
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { fetchAllFoodSubreddits } from '../lib/reddit.js';
import { extractIngredientsWithKeywords } from '../lib/ingredient-extractor.js';

config({ path: '.env' });

const prisma = new PrismaClient();

async function fetchRedditPosts() {
  console.log('[Reddit] Starting Reddit food posts fetch...');
  const startTime = Date.now();

  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
    console.warn('[Reddit] REDDIT_CLIENT_ID/SECRET not set, skipping');
    return;
  }

  let totalNew = 0;
  let totalUpdated = 0;

  try {
    const posts = await fetchAllFoodSubreddits(25);
    console.log(`[Reddit] Fetched ${posts.length} posts from all subreddits`);

    for (const post of posts) {
      try {
        // Extract ingredients from title
        const ingredients = extractIngredientsWithKeywords(
          post.title,
          post.selfText || ''
        );

        const existing = await prisma.redditPost.findUnique({
          where: { redditId: post.redditId },
        });

        if (existing) {
          // Update score/comments for existing posts
          await prisma.redditPost.update({
            where: { redditId: post.redditId },
            data: {
              score: post.score,
              numComments: post.numComments,
              upvoteRatio: post.upvoteRatio,
              fetchedAt: new Date(),
            },
          });
          totalUpdated++;
        } else {
          await prisma.redditPost.create({
            data: {
              ...post,
              ingredients: ingredients.map(i => i.name),
            },
          });
          totalNew++;
        }
      } catch (error: any) {
        if (error?.code === 'P2002') continue;
        console.error(`[Reddit] Error processing ${post.redditId}:`, error);
      }
    }

    // Update platform status
    await prisma.platformSource.upsert({
      where: { platform: 'reddit' },
      update: {
        lastFetchedAt: new Date(),
        lastStatus: 'success',
        itemsFetched: totalNew,
        errorMessage: null,
      },
      create: {
        platform: 'reddit',
        lastFetchedAt: new Date(),
        lastStatus: 'success',
        itemsFetched: totalNew,
      },
    });
  } catch (error: any) {
    console.error('[Reddit] Fatal error:', error);
    await prisma.platformSource.upsert({
      where: { platform: 'reddit' },
      update: {
        lastFetchedAt: new Date(),
        lastStatus: 'error',
        errorMessage: error.message,
      },
      create: {
        platform: 'reddit',
        lastFetchedAt: new Date(),
        lastStatus: 'error',
        errorMessage: error.message,
      },
    });
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log(`[Reddit] Done in ${duration}s. New: ${totalNew}, Updated: ${totalUpdated}`);
}

fetchRedditPosts()
  .catch(err => {
    console.error('[Reddit] Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
