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
    corrections,
    outcomes,
    ingredientTrends,
    extractionFeedback,
    opportunityCalibration,
    googleTrends,
    googleTrendRelated,
    videos,
    ingredients,
    searches,
  ] = await Promise.all([
    prisma.correction.count(),
    prisma.outcome.count(),
    prisma.ingredientTrend.count(),
    prisma.extractionFeedback.count(),
    prisma.opportunityCalibration.count(),
    prisma.googleTrend.count(),
    prisma.googleTrendRelatedQuery.count(),
    prisma.video.count(),
    prisma.ingredient.count(),
    prisma.search.count(),
  ]);

  console.log('--- Core Training Data ---');
  console.log(`  Corrections: ${corrections}`);
  console.log(`  Outcomes: ${outcomes}`);
  console.log(`  Ingredient Trends: ${ingredientTrends}`);
  console.log(`  Extraction Feedback: ${extractionFeedback}`);
  console.log(`  Opportunity Calibration: ${opportunityCalibration}`);

  console.log('\n--- Google Trends Data ---');
  console.log(`  Google Trend records: ${googleTrends}`);
  console.log(`  Related queries: ${googleTrendRelated}`);

  console.log('\n--- Content Data ---');
  console.log(`  Videos: ${videos}`);
  console.log(`  Ingredients: ${ingredients}`);
  console.log(`  Searches: ${searches}`);

  // ML Readiness Assessment
  console.log('\n--- ML Readiness Assessment ---');

  if (corrections >= 500) {
    console.log('  ✓ Extraction Quality Classifier: READY (500+ corrections)');
  } else {
    console.log(`  ✗ Extraction Quality Classifier: Need ${500 - corrections} more corrections`);
  }

  if (outcomes >= 200) {
    console.log('  ✓ Opportunity Success Predictor: READY (200+ outcomes)');
  } else {
    console.log(`  ✗ Opportunity Success Predictor: Need ${200 - outcomes} more outcomes`);
  }

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

  // Correction breakdown
  if (corrections > 0) {
    const correctionBreakdown = await prisma.correction.groupBy({
      by: ['action'],
      _count: { id: true },
    });

    console.log('\n--- Correction Breakdown ---');
    for (const c of correctionBreakdown) {
      console.log(`  ${c.action}: ${c._count.id}`);
    }
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
