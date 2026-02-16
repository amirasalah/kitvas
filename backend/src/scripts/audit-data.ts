/**
 * Data Audit Script
 *
 * Checks data volumes for ML readiness assessment.
 *
 * Usage:
 *   npx tsx src/scripts/audit-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('=== Kitvas Data Audit ===\n');

  // Core data tables
  const [
    ingredientTrends,
    googleTrends,
    googleTrendRelated,
    videos,
    ingredients,
    searches,
  ] = await Promise.all([
    prisma.ingredientTrend.count(),
    prisma.googleTrend.count(),
    prisma.googleTrendRelatedQuery.count(),
    prisma.video.count(),
    prisma.ingredient.count(),
    prisma.search.count(),
  ]);

  console.log('--- Core Training Data ---');
  console.log(`  Ingredient Trends: ${ingredientTrends}`);

  console.log('\n--- Google Trends Data ---');
  console.log(`  Google Trend records: ${googleTrends}`);
  console.log(`  Related queries: ${googleTrendRelated}`);

  console.log('\n--- Content Data ---');
  console.log(`  Videos: ${videos}`);
  console.log(`  Ingredients: ${ingredients}`);
  console.log(`  Searches: ${searches}`);

  // ML Readiness Assessment
  console.log('\n--- ML Readiness Assessment ---');

  // Check Google Trends date range
  const trendsDateRange = await prisma.googleTrend.aggregate({
    _min: { date: true },
    _max: { date: true },
  });

  if (trendsDateRange._min.date && trendsDateRange._max.date) {
    const daysCovered = Math.ceil(
      (trendsDateRange._max.date.getTime() - trendsDateRange._min.date.getTime()) / (1000 * 60 * 60 * 24)
    );
    console.log(`  Google Trends coverage: ${daysCovered} days`);

    if (daysCovered >= 90) {
      console.log('  ✓ Demand Forecasting Model: READY (90+ days of trends)');
    } else {
      console.log(`  ✗ Demand Forecasting Model: Need ${90 - daysCovered} more days of data`);
    }
  } else {
    console.log('  ✗ Demand Forecasting Model: No Google Trends data yet');
  }

  // IngredientTrend analysis (checking if orphaned)
  if (ingredientTrends > 0) {
    const trendPeriods = await prisma.ingredientTrend.groupBy({
      by: ['period'],
      _count: { id: true },
    });

    console.log('\n--- Ingredient Trend Periods ---');
    for (const t of trendPeriods) {
      console.log(`  ${t.period}: ${t._count.id} records`);
    }
  } else {
    console.log('\n--- Ingredient Trend Status ---');
    console.log('  ⚠ No IngredientTrend data collected yet');
  }

  console.log('\n=== Audit Complete ===');

  await prisma.$disconnect();
}

main().catch(console.error);
