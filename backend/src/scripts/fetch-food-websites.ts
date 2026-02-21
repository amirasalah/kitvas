/**
 * Food Website RSS Fetcher
 *
 * Parses RSS feeds from major food publications.
 * Extracts ingredients from article titles and excerpts.
 * Schedule: Every 6 hours
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { fetchAllFeeds } from '../lib/rss-fetcher.js';
import { extractIngredientsWithKeywords } from '../lib/ingredient-extractor.js';

config({ path: '.env' });

const prisma = new PrismaClient();

async function fetchFoodWebsites() {
  console.log('[RSS] Starting food website RSS fetch...');
  const startTime = Date.now();
  let totalNew = 0;

  try {
    const articles = await fetchAllFeeds();
    console.log(`[RSS] Fetched ${articles.length} articles from all feeds`);

    for (const article of articles) {
      try {
        // Extract ingredients from title + excerpt
        const ingredients = extractIngredientsWithKeywords(
          article.title,
          article.excerpt || ''
        );

        await prisma.webArticle.upsert({
          where: { url: article.url },
          update: {
            title: article.title,
            fetchedAt: new Date(),
          },
          create: {
            url: article.url,
            source: article.source,
            title: article.title,
            author: article.author,
            excerpt: article.excerpt,
            imageUrl: article.imageUrl,
            ingredients: ingredients.map(i => i.name),
            categories: article.categories,
            publishedAt: article.publishedAt,
          },
        });
        totalNew++;
      } catch (error: any) {
        if (error?.code === 'P2002') continue;
        console.error(`[RSS] Error processing ${article.url}:`, error);
      }
    }

    // Update platform status
    await prisma.platformSource.upsert({
      where: { platform: 'web' },
      update: {
        lastFetchedAt: new Date(),
        lastStatus: 'success',
        itemsFetched: totalNew,
        errorMessage: null,
      },
      create: {
        platform: 'web',
        lastFetchedAt: new Date(),
        lastStatus: 'success',
        itemsFetched: totalNew,
      },
    });
  } catch (error: any) {
    console.error('[RSS] Fatal error:', error);
    await prisma.platformSource.upsert({
      where: { platform: 'web' },
      update: {
        lastFetchedAt: new Date(),
        lastStatus: 'error',
        errorMessage: error.message,
      },
      create: {
        platform: 'web',
        lastFetchedAt: new Date(),
        lastStatus: 'error',
        errorMessage: error.message,
      },
    });
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log(`[RSS] Done in ${duration}s. New/Updated: ${totalNew}`);
}

fetchFoodWebsites()
  .catch(err => {
    console.error('[RSS] Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
