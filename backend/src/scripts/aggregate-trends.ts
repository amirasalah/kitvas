/**
 * Trend Aggregation Script
 *
 * Aggregates search patterns into IngredientTrend table for analytics.
 * Run daily (recommended: after midnight via cron).
 *
 * Usage:
 *   npx tsx src/scripts/aggregate-trends.ts
 *   npx tsx src/scripts/aggregate-trends.ts --period=weekly
 *   npx tsx src/scripts/aggregate-trends.ts --backfill=30
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AggregationResult {
  ingredientId: string;
  ingredientName: string;
  searchCount: number;
  videoCount: number;
  avgViews: number | null;
}

async function aggregatePeriod(
  periodType: 'daily' | 'weekly' | 'monthly',
  periodStart: Date
): Promise<number> {
  // Calculate period end
  const periodEnd = new Date(periodStart);
  if (periodType === 'daily') {
    periodEnd.setDate(periodEnd.getDate() + 1);
  } else if (periodType === 'weekly') {
    periodEnd.setDate(periodEnd.getDate() + 7);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  // Get searches in this period
  const searches = await prisma.search.findMany({
    where: {
      createdAt: { gte: periodStart, lt: periodEnd },
    },
    select: { ingredients: true },
  });

  if (searches.length === 0) {
    console.log(`  No searches found for ${periodType} starting ${periodStart.toISOString().split('T')[0]}`);
    return 0;
  }

  // Count ingredient occurrences in searches
  const ingredientSearchCounts = new Map<string, number>();
  for (const search of searches) {
    for (const ing of search.ingredients) {
      ingredientSearchCounts.set(ing, (ingredientSearchCounts.get(ing) || 0) + 1);
    }
  }

  // Get ingredient IDs
  const ingredientNames = Array.from(ingredientSearchCounts.keys());
  const ingredients = await prisma.ingredient.findMany({
    where: { name: { in: ingredientNames } },
    select: { id: true, name: true },
  });

  const nameToId = new Map(ingredients.map((i) => [i.name, i.id]));

  // Get video counts and avg views for each ingredient in this period
  const videoStats = await prisma.videoIngredient.groupBy({
    by: ['ingredientId'],
    where: {
      ingredientId: { in: ingredients.map((i) => i.id) },
      video: {
        extractedAt: { gte: periodStart, lt: periodEnd },
      },
    },
    _count: { videoId: true },
  });

  const videoCountMap = new Map(videoStats.map((v) => [v.ingredientId, v._count.videoId]));

  // For each ingredient, calculate avg views from sample of videos
  const ingredientAvgViews = new Map<string, number>();
  for (const ing of ingredients) {
    const videos = await prisma.video.findMany({
      where: {
        videoIngredients: { some: { ingredientId: ing.id } },
        views: { not: null },
      },
      select: { views: true },
      take: 100, // Sample for performance
    });

    if (videos.length > 0) {
      const avg = videos.reduce((sum, v) => sum + (v.views || 0), 0) / videos.length;
      ingredientAvgViews.set(ing.id, Math.round(avg));
    }
  }

  // Upsert trends
  let upsertedCount = 0;
  for (const [name, searchCount] of ingredientSearchCounts) {
    const ingredientId = nameToId.get(name);
    if (!ingredientId) continue; // Skip ingredients not in DB yet

    await prisma.ingredientTrend.upsert({
      where: {
        ingredientId_period_periodStart: {
          ingredientId,
          period: periodType,
          periodStart,
        },
      },
      update: {
        searchCount,
        videoCount: videoCountMap.get(ingredientId) || 0,
        avgViews: ingredientAvgViews.get(ingredientId) || null,
      },
      create: {
        ingredientId,
        period: periodType,
        periodStart,
        searchCount,
        videoCount: videoCountMap.get(ingredientId) || 0,
        avgViews: ingredientAvgViews.get(ingredientId) || null,
      },
    });
    upsertedCount++;
  }

  console.log(`  ${periodType} ${periodStart.toISOString().split('T')[0]}: ${upsertedCount} ingredients, ${searches.length} searches`);
  return upsertedCount;
}

async function aggregateDaily(daysBack: number = 1): Promise<void> {
  console.log(`\nAggregating daily trends for last ${daysBack} days...`);

  for (let i = daysBack; i >= 1; i--) {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - i);
    periodStart.setHours(0, 0, 0, 0);

    await aggregatePeriod('daily', periodStart);
  }
}

async function aggregateWeekly(): Promise<void> {
  console.log('\nAggregating weekly trends...');

  // Get start of current week (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diff - 7); // Previous week
  weekStart.setHours(0, 0, 0, 0);

  await aggregatePeriod('weekly', weekStart);
}

async function aggregateMonthly(): Promise<void> {
  console.log('\nAggregating monthly trends...');

  // Get start of previous month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  await aggregatePeriod('monthly', monthStart);
}

async function main(): Promise<void> {
  console.log('=== Trend Aggregation Script ===');
  console.log(`Started at: ${new Date().toISOString()}`);

  const args = process.argv.slice(2);
  const periodArg = args.find((a) => a.startsWith('--period='));
  const backfillArg = args.find((a) => a.startsWith('--backfill='));

  try {
    if (backfillArg) {
      // Backfill mode: aggregate multiple days
      const days = parseInt(backfillArg.split('=')[1], 10);
      if (isNaN(days) || days < 1 || days > 365) {
        console.error('Invalid backfill days. Use --backfill=N where N is 1-365');
        process.exit(1);
      }
      await aggregateDaily(days);
    } else if (periodArg) {
      const period = periodArg.split('=')[1];
      if (period === 'daily') {
        await aggregateDaily(1);
      } else if (period === 'weekly') {
        await aggregateWeekly();
      } else if (period === 'monthly') {
        await aggregateMonthly();
      } else {
        console.error('Invalid period. Use --period=daily|weekly|monthly');
        process.exit(1);
      }
    } else {
      // Default: run all aggregations
      await aggregateDaily(1);

      // Run weekly on Mondays
      if (new Date().getDay() === 1) {
        await aggregateWeekly();
      }

      // Run monthly on 1st of month
      if (new Date().getDate() === 1) {
        await aggregateMonthly();
      }
    }

    console.log('\n✓ Trend aggregation complete');
  } catch (error) {
    console.error('Error during aggregation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
