/**
 * Opportunity Classifier
 *
 * A lightweight rule-based classifier that scores content opportunities.
 *
 * The classifier:
 * 1. Takes demand signal features as input
 * 2. Applies static thresholds
 * 3. Returns a score ('high' | 'medium' | 'low') with confidence and reasoning
 */

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
  confidence: number;       // 0-1
  reasoning: string;        // Human-readable explanation
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
export function classifyOpportunity(features: OpportunityFeatures): ClassificationResult {
  const compositeScore = calculateCompositeScore(features);
  const { contentGapScore, videoCount } = features;

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

  // Adjust confidence based on data quality
  if (videoCount < 5) {
    confidence *= 0.7; // Less confident with small sample
  }

  return {
    score,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: buildReasoning(score, features, compositeScore),
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
