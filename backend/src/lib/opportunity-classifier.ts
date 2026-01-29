/**
 * Opportunity Classifier
 *
 * A lightweight rule-based classifier that uses calibration data to improve
 * opportunity score predictions. No external ML dependencies needed.
 *
 * The classifier:
 * 1. Takes demand signal features as input
 * 2. Applies calibrated thresholds from OpportunityCalibration table
 * 3. Returns a score ('high' | 'medium' | 'low') with confidence and reasoning
 */

import { PrismaClient } from '@prisma/client';

export interface OpportunityFeatures {
  demandScore: number;      // 0-100 from demand calculator
  contentGapScore: number;  // 0-100 from demand calculator
  avgViews: number;         // Average views of similar videos
  videoCount: number;       // Number of similar videos
  recentVideoRatio: number; // % of videos in last 90 days (0-1)
  demandBand: string;       // 'hot' | 'growing' | 'stable' | 'niche' | 'unknown'
}

export interface ClassificationResult {
  score: 'high' | 'medium' | 'low';
  confidence: number;       // 0-1 based on calibration data
  reasoning: string;        // Human-readable explanation
  calibrationBased: boolean; // Whether calibration data was used
}

// Default thresholds (used when no calibration data)
const DEFAULT_THRESHOLDS = {
  high: {
    demandScore: 70,
    contentGapScore: 60,
    minViews: 50000,
  },
  medium: {
    demandScore: 45,
    contentGapScore: 40,
    minViews: 10000,
  },
};

// Calibrated weights from outcome analysis
// These can be updated by the calibration script
interface CalibratedWeights {
  demandScoreWeight: number;
  contentGapWeight: number;
  viewsWeight: number;
  freshnessWeight: number;
  highThreshold: number;
  mediumThreshold: number;
}

// Cache for calibration data
let calibrationCache: Map<string, { successRate: number; totalOutcomes: number }> | null = null;
let calibrationCacheTime: Date | null = null;
const CALIBRATION_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Load calibration data from database
 */
async function loadCalibrationData(prisma: PrismaClient): Promise<void> {
  // Check cache freshness
  if (calibrationCache && calibrationCacheTime &&
      Date.now() - calibrationCacheTime.getTime() < CALIBRATION_CACHE_TTL) {
    return;
  }

  try {
    const calibrations = await prisma.opportunityCalibration.findMany({
      where: { totalOutcomes: { gte: 3 } }, // Only use buckets with enough data
    });

    calibrationCache = new Map();
    for (const cal of calibrations) {
      const key = `${cal.demandBand}:${cal.opportunityScore}`;
      calibrationCache.set(key, {
        successRate: cal.successRate,
        totalOutcomes: cal.totalOutcomes,
      });
    }

    calibrationCacheTime = new Date();
    console.log(`[Classifier] Loaded ${calibrations.length} calibration entries`);
  } catch (error) {
    console.warn('[Classifier] Failed to load calibration:', error);
    calibrationCache = new Map();
  }
}

/**
 * Get calibrated success rate for a demand band + score combination
 */
function getCalibratedSuccessRate(demandBand: string, score: string): number | null {
  if (!calibrationCache) return null;

  const key = `${demandBand}:${score}`;
  const cal = calibrationCache.get(key);

  return cal ? cal.successRate : null;
}

/**
 * Calculate a composite opportunity score from features
 */
function calculateCompositeScore(features: OpportunityFeatures): number {
  const {
    demandScore,
    contentGapScore,
    avgViews,
    recentVideoRatio,
  } = features;

  // Normalize views to 0-100 scale (log scale, caps at 1M)
  const normalizedViews = Math.min(100, (Math.log10(Math.max(avgViews, 1)) / 6) * 100);

  // Freshness bonus (emerging topics get a boost)
  const freshnessBonus = recentVideoRatio > 0.3 ? 10 : 0;

  // Weighted composite score
  const composite = (
    demandScore * 0.35 +           // Demand is most important
    contentGapScore * 0.30 +       // Content gap is second
    normalizedViews * 0.20 +       // Views validate demand
    freshnessBonus * 0.15          // Freshness indicates trends
  );

  return Math.round(composite);
}

/**
 * Classify an opportunity based on features
 */
export async function classifyOpportunity(
  prisma: PrismaClient,
  features: OpportunityFeatures
): Promise<ClassificationResult> {
  // Load calibration data
  await loadCalibrationData(prisma);

  const compositeScore = calculateCompositeScore(features);
  const { demandBand, contentGapScore, avgViews, videoCount } = features;

  // Get calibrated success rates for each score tier
  const highSuccessRate = getCalibratedSuccessRate(demandBand, 'high');
  const mediumSuccessRate = getCalibratedSuccessRate(demandBand, 'medium');
  const lowSuccessRate = getCalibratedSuccessRate(demandBand, 'low');

  const hasCalibration = highSuccessRate !== null || mediumSuccessRate !== null;

  // Decision logic
  let score: 'high' | 'medium' | 'low';
  let confidence: number;
  let reasoning: string;

  if (compositeScore >= 70 && contentGapScore >= 50) {
    score = 'high';
    confidence = hasCalibration && highSuccessRate !== null
      ? highSuccessRate
      : 0.7; // Default confidence

    reasoning = buildReasoning('high', features, compositeScore);

    // Adjust confidence based on calibration
    if (highSuccessRate !== null && highSuccessRate < 0.4) {
      // Calibration shows high scores don't actually perform well
      score = 'medium';
      reasoning += ' (Downgraded: calibration shows lower success rate)';
    }
  } else if (compositeScore >= 45 && contentGapScore >= 30) {
    score = 'medium';
    confidence = hasCalibration && mediumSuccessRate !== null
      ? mediumSuccessRate
      : 0.5;

    reasoning = buildReasoning('medium', features, compositeScore);

    // Potential upgrade if calibration is very positive
    if (mediumSuccessRate !== null && mediumSuccessRate > 0.7) {
      reasoning += ' (Calibration shows this tier performs well)';
      confidence = mediumSuccessRate;
    }
  } else {
    score = 'low';
    confidence = hasCalibration && lowSuccessRate !== null
      ? 1 - lowSuccessRate // Confidence in "low" = inverse of success
      : 0.6;

    reasoning = buildReasoning('low', features, compositeScore);
  }

  // Adjust confidence based on data quality
  if (videoCount < 5) {
    confidence *= 0.7; // Less confident with small sample
    reasoning += ' (Limited data)';
  }

  return {
    score,
    confidence: Math.round(confidence * 100) / 100,
    reasoning,
    calibrationBased: hasCalibration,
  };
}

/**
 * Build human-readable reasoning for the classification
 */
function buildReasoning(
  score: 'high' | 'medium' | 'low',
  features: OpportunityFeatures,
  compositeScore: number
): string {
  const { demandBand, contentGapScore, avgViews, recentVideoRatio, videoCount } = features;

  const parts: string[] = [];

  // Demand band insight
  if (demandBand === 'hot') {
    parts.push('High viewer demand');
  } else if (demandBand === 'growing') {
    parts.push('Growing interest');
  } else if (demandBand === 'niche') {
    parts.push('Niche audience');
  }

  // Content gap insight
  if (contentGapScore >= 70) {
    parts.push('significant content gap');
  } else if (contentGapScore >= 50) {
    parts.push('moderate content gap');
  } else if (contentGapScore < 30) {
    parts.push('saturated market');
  }

  // Performance insight
  if (avgViews >= 100000) {
    parts.push(`strong view potential (${Math.round(avgViews / 1000)}K avg)`);
  } else if (avgViews >= 50000) {
    parts.push(`good view potential (${Math.round(avgViews / 1000)}K avg)`);
  }

  // Freshness insight
  if (recentVideoRatio > 0.4) {
    parts.push('trending topic');
  } else if (recentVideoRatio < 0.1 && videoCount > 10) {
    parts.push('established category');
  }

  const reasoningText = parts.length > 0 ? parts.join(', ') : 'Based on composite analysis';

  return `${score.toUpperCase()}: ${reasoningText} (score: ${compositeScore})`;
}

/**
 * Simple classification without database access (for quick estimates)
 */
export function classifyOpportunitySimple(features: OpportunityFeatures): Omit<ClassificationResult, 'calibrationBased'> {
  const compositeScore = calculateCompositeScore(features);
  const { contentGapScore } = features;

  let score: 'high' | 'medium' | 'low';
  let confidence: number;

  if (compositeScore >= 70 && contentGapScore >= 50) {
    score = 'high';
    confidence = 0.7;
  } else if (compositeScore >= 45 && contentGapScore >= 30) {
    score = 'medium';
    confidence = 0.5;
  } else {
    score = 'low';
    confidence = 0.6;
  }

  return {
    score,
    confidence,
    reasoning: buildReasoning(score, features, compositeScore),
  };
}
