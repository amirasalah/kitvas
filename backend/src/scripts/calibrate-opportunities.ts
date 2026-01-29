/**
 * Opportunity Calibration Script
 *
 * Correlates predicted opportunity scores with actual outcomes to measure
 * and improve prediction accuracy. Populates OpportunityCalibration table.
 *
 * Run weekly to update calibration data.
 *
 * Usage:
 *   npx tsx src/scripts/calibrate-opportunities.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CalibrationBucket {
  demandBand: string;
  opportunityScore: string;
  outcomes: Array<{
    views7day: number | null;
    rating: number | null;
  }>;
}

async function gatherOutcomeData(): Promise<CalibrationBucket[]> {
  console.log('\n--- Gathering Outcome Data ---');

  // Get all outcomes with their tracked opportunities
  const outcomes = await prisma.outcome.findMany({
    where: {
      rating: { not: null }, // Only outcomes with ratings
    },
    include: {
      trackedOpportunity: {
        select: {
          opportunityScore: true,
          ingredients: true,
        },
      },
    },
  });

  console.log(`  Found ${outcomes.length} rated outcomes`);

  if (outcomes.length === 0) {
    return [];
  }

  // Get demand signals for each opportunity's ingredients
  const buckets = new Map<string, CalibrationBucket>();

  for (const outcome of outcomes) {
    const { opportunityScore, ingredients } = outcome.trackedOpportunity;

    // Look up the demand signal for these ingredients
    const ingredientKey = [...ingredients].sort().join('|');
    const demandSignal = await prisma.demandSignal.findUnique({
      where: { ingredientKey },
    });

    // Default to 'unknown' if no demand signal exists
    const demandBand = demandSignal?.demandBand || 'unknown';
    const bucketKey = `${demandBand}:${opportunityScore}`;

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, {
        demandBand,
        opportunityScore,
        outcomes: [],
      });
    }

    buckets.get(bucketKey)!.outcomes.push({
      views7day: outcome.views7day,
      rating: outcome.rating,
    });
  }

  return Array.from(buckets.values());
}

async function calculateCalibration(buckets: CalibrationBucket[]): Promise<void> {
  console.log('\n--- Calculating Calibration Metrics ---');

  for (const bucket of buckets) {
    const { demandBand, opportunityScore, outcomes } = bucket;

    if (outcomes.length === 0) continue;

    // Calculate metrics
    const validViews = outcomes.filter((o) => o.views7day !== null);
    const validRatings = outcomes.filter((o) => o.rating !== null);

    const avgViews7day = validViews.length > 0
      ? Math.round(validViews.reduce((sum, o) => sum + (o.views7day || 0), 0) / validViews.length)
      : 0;

    const avgRating = validRatings.length > 0
      ? validRatings.reduce((sum, o) => sum + (o.rating || 0), 0) / validRatings.length
      : 0;

    const successCount = validRatings.filter((o) => (o.rating || 0) >= 4).length;
    const successRate = validRatings.length > 0 ? successCount / validRatings.length : 0;

    console.log(`  ${demandBand} + ${opportunityScore}: ${outcomes.length} outcomes`);
    console.log(`    Avg views (7d): ${avgViews7day.toLocaleString()}`);
    console.log(`    Avg rating: ${avgRating.toFixed(2)}`);
    console.log(`    Success rate: ${(successRate * 100).toFixed(1)}%`);

    // Upsert calibration data
    await prisma.opportunityCalibration.upsert({
      where: {
        demandBand_opportunityScore: {
          demandBand,
          opportunityScore,
        },
      },
      update: {
        totalOutcomes: outcomes.length,
        avgViews7day: avgViews7day,
        avgRating: +avgRating.toFixed(2),
        successRate: +successRate.toFixed(3),
        calculatedAt: new Date(),
      },
      create: {
        demandBand,
        opportunityScore,
        totalOutcomes: outcomes.length,
        avgViews7day: avgViews7day,
        avgRating: +avgRating.toFixed(2),
        successRate: +successRate.toFixed(3),
      },
    });
  }
}

async function analyzeCalibration(): Promise<void> {
  console.log('\n--- Calibration Analysis ---');

  const calibrations = await prisma.opportunityCalibration.findMany({
    where: {
      totalOutcomes: { gte: 3 }, // Only buckets with enough data
    },
    orderBy: [{ opportunityScore: 'asc' }, { demandBand: 'asc' }],
  });

  if (calibrations.length === 0) {
    console.log('  Not enough data for analysis (need 3+ outcomes per bucket)');
    return;
  }

  // Group by opportunity score to see if predictions are accurate
  const byScore = new Map<string, typeof calibrations>();
  for (const cal of calibrations) {
    if (!byScore.has(cal.opportunityScore)) {
      byScore.set(cal.opportunityScore, []);
    }
    byScore.get(cal.opportunityScore)!.push(cal);
  }

  console.log('\n  Success rates by opportunity score:');
  for (const [score, cals] of byScore) {
    const totalOutcomes = cals.reduce((sum, c) => sum + c.totalOutcomes, 0);
    const weightedSuccessRate = cals.reduce((sum, c) => sum + c.successRate * c.totalOutcomes, 0) / totalOutcomes;
    console.log(`    ${score}: ${(weightedSuccessRate * 100).toFixed(1)}% success (${totalOutcomes} outcomes)`);
  }

  // Check if high > medium > low (expected pattern)
  const highSuccess = byScore.get('high');
  const mediumSuccess = byScore.get('medium');
  const lowSuccess = byScore.get('low');

  if (highSuccess && mediumSuccess && lowSuccess) {
    const highRate = highSuccess.reduce((sum, c) => sum + c.successRate * c.totalOutcomes, 0) /
      highSuccess.reduce((sum, c) => sum + c.totalOutcomes, 0);
    const mediumRate = mediumSuccess.reduce((sum, c) => sum + c.successRate * c.totalOutcomes, 0) /
      mediumSuccess.reduce((sum, c) => sum + c.totalOutcomes, 0);
    const lowRate = lowSuccess.reduce((sum, c) => sum + c.successRate * c.totalOutcomes, 0) /
      lowSuccess.reduce((sum, c) => sum + c.totalOutcomes, 0);

    console.log('\n  Prediction accuracy check:');
    if (highRate > mediumRate && mediumRate > lowRate) {
      console.log('    ✓ Predictions are well-calibrated (high > medium > low)');
    } else if (highRate > lowRate) {
      console.log('    ~ Predictions are partially calibrated (high > low, but medium is off)');
    } else {
      console.log('    ✗ Predictions need improvement (ranking doesn\'t match outcomes)');
    }
  }

  // Suggest weight adjustments based on what demand bands correlate with success
  console.log('\n  Demand band insights:');
  const byDemand = new Map<string, typeof calibrations>();
  for (const cal of calibrations) {
    if (!byDemand.has(cal.demandBand)) {
      byDemand.set(cal.demandBand, []);
    }
    byDemand.get(cal.demandBand)!.push(cal);
  }

  for (const [band, cals] of byDemand) {
    const totalOutcomes = cals.reduce((sum, c) => sum + c.totalOutcomes, 0);
    const avgViews = Math.round(cals.reduce((sum, c) => sum + c.avgViews7day * c.totalOutcomes, 0) / totalOutcomes);
    const avgSuccess = cals.reduce((sum, c) => sum + c.successRate * c.totalOutcomes, 0) / totalOutcomes;
    console.log(`    ${band}: ${avgViews.toLocaleString()} avg views, ${(avgSuccess * 100).toFixed(1)}% success`);
  }
}

async function main(): Promise<void> {
  console.log('=== Opportunity Calibration Script ===');
  console.log(`Started at: ${new Date().toISOString()}`);

  try {
    // Step 1: Gather outcome data grouped by demand band + opportunity score
    const buckets = await gatherOutcomeData();

    if (buckets.length === 0) {
      console.log('\nNo outcomes to calibrate. Users need to report outcomes first.');
      console.log('Tip: Outcomes can be reported 30+ days after tracking an opportunity.');
      return;
    }

    // Step 2: Calculate and store calibration metrics
    await calculateCalibration(buckets);

    // Step 3: Analyze calibration for insights
    await analyzeCalibration();

    console.log('\n✓ Opportunity calibration complete');
  } catch (error) {
    console.error('Error during calibration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
