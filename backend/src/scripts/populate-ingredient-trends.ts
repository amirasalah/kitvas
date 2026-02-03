/**
 * Populate Ingredient Trends Script
 *
 * Aggregates search data and video data to populate the IngredientTrend table.
 * This enables trend analysis and ML features.
 *
 * Usage:
 *   npx tsx src/scripts/populate-ingredient-trends.ts
 *   npx tsx src/scripts/populate-ingredient-trends.ts --days=90
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TrendData {
  ingredientId: string;
  period: 'daily' | 'weekly' | 'monthly';
  periodStart: Date;
  searchCount: number;
  videoCount: number;
  avgViews: number | null;
}

function getDateKey(date: Date, period: 'daily' | 'weekly' | 'monthly'): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (period === 'daily') {
    return d.toISOString().split('T')[0];
  } else if (period === 'weekly') {
    // Get start of week (Sunday)
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d.toISOString().split('T')[0];
  } else {
    // Start of month
    d.setDate(1);
    return d.toISOString().split('T')[0];
  }
}

function parseDate(dateKey: string): Date {
  return new Date(dateKey + 'T00:00:00.000Z');
}

async function aggregateSearches(
  days: number,
  period: 'daily' | 'weekly' | 'monthly'
): Promise<Map<string, Map<string, number>>> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const searches = await prisma.search.findMany({
    where: { createdAt: { gte: since } },
    select: {
      ingredients: true,
      createdAt: true,
    },
  });

  // Map: ingredientName -> periodKey -> count
  const aggregated = new Map<string, Map<string, number>>();

  for (const search of searches) {
    const periodKey = getDateKey(search.createdAt, period);

    for (const ingredient of search.ingredients) {
      const normalizedName = ingredient.toLowerCase().trim();
      if (!aggregated.has(normalizedName)) {
        aggregated.set(normalizedName, new Map());
      }
      const periods = aggregated.get(normalizedName)!;
      periods.set(periodKey, (periods.get(periodKey) || 0) + 1);
    }
  }

  return aggregated;
}

async function aggregateVideos(
  days: number,
  period: 'daily' | 'weekly' | 'monthly'
): Promise<Map<string, Map<string, { count: number; totalViews: number }>>> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const videos = await prisma.video.findMany({
    where: { publishedAt: { gte: since } },
    include: {
      videoIngredients: {
        include: { ingredient: true },
      },
    },
  });

  // Map: ingredientName -> periodKey -> { count, totalViews }
  const aggregated = new Map<string, Map<string, { count: number; totalViews: number }>>();

  for (const video of videos) {
    const periodKey = getDateKey(video.publishedAt, period);

    for (const vi of video.videoIngredients) {
      const name = vi.ingredient.name;
      if (!aggregated.has(name)) {
        aggregated.set(name, new Map());
      }
      const periods = aggregated.get(name)!;
      const existing = periods.get(periodKey) || { count: 0, totalViews: 0 };
      periods.set(periodKey, {
        count: existing.count + 1,
        totalViews: existing.totalViews + (video.views || 0),
      });
    }
  }

  return aggregated;
}

async function main(): Promise<void> {
  console.log('=== Populate Ingredient Trends ===\n');

  const args = process.argv.slice(2);
  const daysArg = args.find((a) => a.startsWith('--days='));
  const days = daysArg ? parseInt(daysArg.split('=')[1], 10) : 90;

  console.log(`Processing last ${days} days of data...\n`);

  // Get all ingredients for ID lookup
  const ingredients = await prisma.ingredient.findMany({
    select: { id: true, name: true },
  });
  const ingredientNameToId = new Map(ingredients.map((i) => [i.name.toLowerCase(), i.id]));

  const periods: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly'];
  let totalCreated = 0;
  let totalUpdated = 0;

  for (const period of periods) {
    console.log(`\n--- Processing ${period} trends ---`);

    // Get search aggregations
    const searchAgg = await aggregateSearches(days, period);
    console.log(`  Found searches for ${searchAgg.size} ingredients`);

    // Get video aggregations
    const videoAgg = await aggregateVideos(days, period);
    console.log(`  Found videos for ${videoAgg.size} ingredients`);

    // Merge all ingredient names
    const allIngredients = new Set([...searchAgg.keys(), ...videoAgg.keys()]);

    for (const ingredientName of allIngredients) {
      const ingredientId = ingredientNameToId.get(ingredientName);
      if (!ingredientId) {
        // Skip ingredients not in our database
        continue;
      }

      const searchPeriods = searchAgg.get(ingredientName) || new Map();
      const videoPeriods = videoAgg.get(ingredientName) || new Map();

      // Merge all period keys
      const allPeriodKeys = new Set([...searchPeriods.keys(), ...videoPeriods.keys()]);

      for (const periodKey of allPeriodKeys) {
        const searchCount = searchPeriods.get(periodKey) || 0;
        const videoData = videoPeriods.get(periodKey);
        const videoCount = videoData?.count || 0;
        const avgViews = videoData ? Math.round(videoData.totalViews / videoData.count) : null;

        const periodStart = parseDate(periodKey);

        try {
          const result = await prisma.ingredientTrend.upsert({
            where: {
              ingredientId_period_periodStart: {
                ingredientId,
                period,
                periodStart,
              },
            },
            update: {
              searchCount,
              videoCount,
              avgViews,
            },
            create: {
              ingredientId,
              period,
              periodStart,
              searchCount,
              videoCount,
              avgViews,
            },
          });

          if (result.searchCount === searchCount && result.videoCount === videoCount) {
            totalUpdated++;
          } else {
            totalCreated++;
          }
        } catch (error) {
          console.error(`  Error for ${ingredientName} on ${periodKey}:`, error);
        }
      }
    }

    // Count records for this period
    const count = await prisma.ingredientTrend.count({ where: { period } });
    console.log(`  Total ${period} records: ${count}`);
  }

  console.log(`\n--- Summary ---`);
  console.log(`  Records created/updated: ${totalCreated + totalUpdated}`);

  // Show top trending ingredients by search count
  const topTrending = await prisma.ingredientTrend.findMany({
    where: { period: 'weekly' },
    orderBy: { searchCount: 'desc' },
    take: 10,
    include: { ingredient: true },
  });

  if (topTrending.length > 0) {
    console.log('\n--- Top Trending (Weekly by Search Count) ---');
    for (const trend of topTrending) {
      console.log(
        `  ${trend.ingredient.name}: ${trend.searchCount} searches, ${trend.videoCount} videos`
      );
    }
  }

  console.log('\n✓ Ingredient trends populated');

  await prisma.$disconnect();
}

main().catch(console.error);
