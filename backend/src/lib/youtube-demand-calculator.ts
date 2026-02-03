/**
 * YouTube Market-Based Demand Calculator
 * Calculates demand signals from YouTube video data (zero extra API calls)
 */

import type { YouTubeVideo } from './youtube.js';

export type DemandBand = 'hot' | 'growing' | 'stable' | 'niche' | 'unknown';
export type ContentGapType = 'underserved' | 'saturated' | 'balanced' | 'emerging';
export type OpportunityType = 'quality_gap' | 'freshness_gap' | 'underserved' | 'trending' | 'google_breakout' | 'velocity_mismatch';
export type OpportunityPriority = 'high' | 'medium' | 'low';

export interface MarketMetrics {
  totalViews: number;
  avgViews: number;
  medianViews: number;
  avgViewsPerDay: number;
  videoCount: number;
}

export interface ContentGap {
  score: number;
  type: ContentGapType;
  reasoning: string;
}

export interface ContentOpportunity {
  type: OpportunityType;
  title: string;
  description: string;
  priority: OpportunityPriority;
}

export interface QualityDistribution {
  topPerformerViews: number;
  bottomPerformerViews: number;
  outlierRatio: number;
}

export interface FreshnessAnalysis {
  avgAgeDays: number;
  recentVideoCount: number;
  recentVideoAvgViews: number;
  isEmergingTopic: boolean;
}

export interface TrendsBoost {
  interestScore: number; // 0-100 from Google Trends
  weekOverWeekGrowth: number; // percentage
  isBreakout: boolean;
}

export interface YouTubeDemandSignal {
  demandScore: number;
  demandBand: DemandBand;
  marketMetrics: MarketMetrics;
  contentGap: ContentGap;
  opportunities: ContentOpportunity[];
  confidence: number;
  sampleSize: number;
  trendsBoost?: TrendsBoost;
}

function formatViews(views: number): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
}

/**
 * Check if an ingredient appears in text with flexible matching
 * Handles compound words like "soy sauce" / "soysauce"
 */
function checkIngredientInText(ingredient: string, text: string): boolean {
  const lowerIng = ingredient.toLowerCase();
  const lowerText = text.toLowerCase();

  // 1. Direct match
  if (lowerText.includes(lowerIng)) return true;

  // 2. Try without spaces (e.g., "soy sauce" matches "soysauce" in text)
  const withoutSpaces = lowerIng.replace(/\s+/g, '');
  if (withoutSpaces !== lowerIng && lowerText.includes(withoutSpaces)) return true;

  // 3. Check compound parts - "soy sauce" matches if both "soy" and "sauce" appear nearby
  const parts = lowerIng.split(/\s+/);
  if (parts.length === 2 && parts.every(part => part.length >= 3 && lowerText.includes(part))) {
    return true;
  }

  return false;
}

/**
 * Calculate how relevant a video is to the searched ingredients
 * Returns 0-1 score based on how many ingredients appear in title/description
 */
function calculateVideoRelevance(
  video: YouTubeVideo,
  ingredients: string[]
): number {
  if (ingredients.length === 0) return 1;

  const text = `${video.snippet.title} ${video.snippet.description}`.toLowerCase();
  const matchCount = ingredients.filter(ing => checkIngredientInText(ing, text)).length;
  return matchCount / ingredients.length;
}

function calculateMarketMetrics(videos: YouTubeVideo[]): MarketMetrics {
  if (videos.length === 0) {
    return {
      totalViews: 0,
      avgViews: 0,
      medianViews: 0,
      avgViewsPerDay: 0,
      videoCount: 0,
    };
  }

  const now = new Date();
  const videoData = videos
    .map(v => {
      const views = parseInt(v.statistics?.viewCount || '0', 10);
      const published = new Date(v.snippet.publishedAt);
      const ageDays = Math.max(1, Math.floor((now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24)));
      return { views, ageDays };
    })
    .filter(v => v.views > 0);

  if (videoData.length === 0) {
    return {
      totalViews: 0,
      avgViews: 0,
      medianViews: 0,
      avgViewsPerDay: 0,
      videoCount: videos.length,
    };
  }

  const views = videoData.map(v => v.views);
  const totalViews = views.reduce((a, b) => a + b, 0);
  const avgViews = totalViews / views.length;

  const sortedViews = [...views].sort((a, b) => a - b);
  const medianViews = sortedViews[Math.floor(sortedViews.length / 2)];

  const viewsPerDay = videoData.map(v => v.views / v.ageDays);
  const avgViewsPerDay = viewsPerDay.reduce((a, b) => a + b, 0) / viewsPerDay.length;

  return {
    totalViews,
    avgViews: Math.round(avgViews),
    medianViews,
    avgViewsPerDay: Math.round(avgViewsPerDay),
    videoCount: videos.length,
  };
}

function calculateQualityDistribution(videos: YouTubeVideo[]): QualityDistribution {
  const views = videos
    .map(v => parseInt(v.statistics?.viewCount || '0', 10))
    .filter(v => v > 0)
    .sort((a, b) => b - a);

  if (views.length < 3) {
    return {
      topPerformerViews: views[0] || 0,
      bottomPerformerViews: views[views.length - 1] || 0,
      outlierRatio: 0,
    };
  }

  // Top 10% (at least 1 video)
  const topCount = Math.max(1, Math.floor(views.length * 0.1));
  const topViews = views.slice(0, topCount);
  const topPerformerViews = topViews.reduce((a, b) => a + b, 0) / topViews.length;

  // Bottom 50%
  const bottomCount = Math.max(1, Math.floor(views.length * 0.5));
  const bottomViews = views.slice(-bottomCount);
  const bottomPerformerViews = bottomViews.reduce((a, b) => a + b, 0) / bottomViews.length;

  // Outlier ratio: how much do top performers dominate?
  const outlierRatio = bottomPerformerViews > 0
    ? topPerformerViews / bottomPerformerViews
    : topPerformerViews > 0 ? 100 : 0;

  return {
    topPerformerViews: Math.round(topPerformerViews),
    bottomPerformerViews: Math.round(bottomPerformerViews),
    outlierRatio: Math.min(100, Math.round(outlierRatio)),
  };
}

function calculateFreshnessAnalysis(videos: YouTubeVideo[]): FreshnessAnalysis {
  if (videos.length === 0) {
    return {
      avgAgeDays: 0,
      recentVideoCount: 0,
      recentVideoAvgViews: 0,
      isEmergingTopic: false,
    };
  }

  const now = new Date();
  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

  const videoAges = videos.map(v => {
    const published = new Date(v.snippet.publishedAt);
    const views = parseInt(v.statistics?.viewCount || '0', 10);
    return {
      ageDays: Math.floor((now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24)),
      views,
      isRecent: (now.getTime() - published.getTime()) < NINETY_DAYS,
    };
  });

  const avgAgeDays = videoAges.reduce((a, b) => a + b.ageDays, 0) / videoAges.length;

  const recentVideos = videoAges.filter(v => v.isRecent);
  const recentVideoCount = recentVideos.length;
  const recentVideoAvgViews = recentVideoCount > 0
    ? recentVideos.reduce((a, b) => a + b.views, 0) / recentVideoCount
    : 0;

  // Emerging topic: Many recent videos (>30%) AND decent performance
  const olderVideos = videoAges.filter(v => !v.isRecent);
  const olderAvgViews = olderVideos.length > 0
    ? olderVideos.reduce((a, b) => a + b.views, 0) / olderVideos.length
    : 0;

  const isEmergingTopic = recentVideoCount >= videos.length * 0.3 &&
    recentVideoAvgViews >= olderAvgViews * 0.5;

  return {
    avgAgeDays: Math.round(avgAgeDays),
    recentVideoCount,
    recentVideoAvgViews: Math.round(recentVideoAvgViews),
    isEmergingTopic,
  };
}

/**
 * Calculate Competition Barrier Score (0-100)
 * Higher score = HARDER to compete
 *
 * Components:
 * - viewBarrier (40%): Based on avgViews - high views = established competition
 * - incumbentAdvantage (30%): Based on % recent videos - few recent = old content dominates
 * - supplyPressure (20%): Based on video count - more videos = more competition
 * - algorithmLockIn (10%): If old content dominates AND few recent videos
 */
function calculateCompetitionBarrier(
  metrics: MarketMetrics,
  freshness: FreshnessAnalysis
): number {
  let barrier = 0;

  // View barrier (0-40 points)
  // High avgViews = established videos dominate = BARRIER, not opportunity
  if (metrics.avgViews >= 1000000) barrier += 40;
  else if (metrics.avgViews >= 500000) barrier += 35;
  else if (metrics.avgViews >= 100000) barrier += 30;
  else if (metrics.avgViews >= 50000) barrier += 20;
  else if (metrics.avgViews >= 10000) barrier += 10;

  // Incumbent advantage (0-30 points)
  // Few recent videos = algorithm locked to old content = harder to break in
  const recentRatio = metrics.videoCount > 0
    ? freshness.recentVideoCount / metrics.videoCount
    : 0;
  if (recentRatio < 0.1) barrier += 30;      // <10% recent = old dominates
  else if (recentRatio < 0.2) barrier += 20; // 10-20%
  else if (recentRatio < 0.4) barrier += 10; // 20-40%
  // >40% recent = new content wins, no barrier added

  // Supply pressure (0-20 points)
  // More videos = more competition for ranking
  if (metrics.videoCount > 50) barrier += 20;
  else if (metrics.videoCount > 30) barrier += 15;
  else if (metrics.videoCount > 15) barrier += 10;
  else if (metrics.videoCount > 5) barrier += 5;

  // Algorithm lock-in (0-10 points)
  // Old average age + few recent = YouTube locked to incumbents
  if (freshness.avgAgeDays > 365 && freshness.recentVideoCount < 3) {
    barrier += 10;
  }

  return Math.min(100, barrier);
}

/**
 * Calculate Opportunity Score (0-100)
 * Higher score = BETTER opportunity for new creators
 *
 * Components:
 * - accessibilityScore (35%): Inverse of barrier - lower barrier = more accessible
 * - demandValidation (25%): avgViews proves audience exists
 * - timingBonus (25%): Google Trends growth, recent videos outperforming
 * - nicheAdvantage (15%): Multi-ingredient searches, low video count
 */
function calculateOpportunityScore(
  metrics: MarketMetrics,
  freshness: FreshnessAnalysis,
  barrier: number,
  ingredientCount: number,
  trendsBoost?: TrendsBoost
): number {
  let score = 0;

  // Accessibility (0-35 points) - inverse of barrier
  if (barrier <= 20) score += 35;      // Very accessible
  else if (barrier <= 40) score += 28;
  else if (barrier <= 60) score += 18;
  else if (barrier <= 80) score += 8;
  // >80 barrier = 0 accessibility points

  // Demand validation (0-25 points)
  // Some avgViews proves people watch this content
  if (metrics.avgViews >= 50000) score += 25;
  else if (metrics.avgViews >= 20000) score += 20;
  else if (metrics.avgViews >= 10000) score += 15;
  else if (metrics.avgViews >= 5000) score += 10;
  else score += 5;

  // Timing bonus (0-25 points)
  let timingBonus = 0;
  if (trendsBoost?.isBreakout) {
    timingBonus += 15;
  } else if (trendsBoost && trendsBoost.weekOverWeekGrowth > 30) {
    timingBonus += 10;
  } else if (trendsBoost && trendsBoost.weekOverWeekGrowth > 10) {
    timingBonus += 5;
  }

  // Recent content outperforming = new videos can win
  if (freshness.recentVideoAvgViews > metrics.avgViews * 1.2) {
    timingBonus += 10;
  }
  score += Math.min(25, timingBonus);

  // Niche advantage (0-15 points)
  if (ingredientCount >= 3) score += 10;      // 3+ ingredients = long-tail
  else if (ingredientCount >= 2) score += 5;  // 2 ingredients = some specificity

  // True underserved: few videos but validated demand
  if (metrics.videoCount < 10 && metrics.avgViews >= 10000) {
    score += 5;
  }

  return Math.min(100, score);
}

/**
 * Classify market based on barrier and opportunity scores
 */
function classifyMarket(
  barrier: number,
  opportunity: number,
  freshness: FreshnessAnalysis,
  trendsBoost?: TrendsBoost
): { type: ContentGapType; reasoning: string } {
  // Calculate timing bonus for emerging detection
  let timingBonus = 0;
  if (trendsBoost?.isBreakout) timingBonus += 15;
  else if (trendsBoost && trendsBoost.weekOverWeekGrowth > 30) timingBonus += 10;
  if (freshness.recentVideoAvgViews > 0 && freshness.isEmergingTopic) timingBonus += 10;

  // SATURATED: High barrier (>60) regardless of opportunity
  if (barrier > 60) {
    return {
      type: 'saturated',
      reasoning: 'High competition - established content dominates rankings'
    };
  }

  // HIGH_BARRIER: Moderate-high barrier (40-60) with low opportunity (<40)
  if (barrier > 40 && opportunity < 40) {
    return {
      type: 'saturated',
      reasoning: 'Difficult market - significant barrier to compete'
    };
  }

  // EMERGING: High opportunity with timing bonus
  if (opportunity > 60 && timingBonus >= 15) {
    return {
      type: 'emerging',
      reasoning: 'Emerging trend - time-sensitive opportunity'
    };
  }

  // OPPORTUNITY: Low barrier (<40) with good opportunity (>50)
  if (barrier < 40 && opportunity > 50) {
    return {
      type: 'underserved',
      reasoning: 'Good opportunity - validated demand with accessible competition'
    };
  }

  // NICHE_OPPORTUNITY: Very low barrier (<30) with moderate opportunity (>=30)
  if (barrier < 30 && opportunity >= 30) {
    return {
      type: 'underserved',
      reasoning: 'Niche opportunity - smaller audience but very accessible'
    };
  }

  // BALANCED: Everything else
  return {
    type: 'balanced',
    reasoning: 'Moderate competition with uncertain opportunity'
  };
}

/**
 * Calculate content gap using the new barrier/opportunity model
 */
function calculateContentGap(
  metrics: MarketMetrics,
  quality: QualityDistribution,
  freshness: FreshnessAnalysis,
  ingredientCount: number = 1,
  trendsBoost?: TrendsBoost
): ContentGap {
  // Calculate the two key scores
  const barrier = calculateCompetitionBarrier(metrics, freshness);
  const opportunity = calculateOpportunityScore(metrics, freshness, barrier, ingredientCount, trendsBoost);

  // Classify the market
  const { type, reasoning } = classifyMarket(barrier, opportunity, freshness, trendsBoost);

  // Score is now opportunity-based (higher = better)
  // But we'll also factor in quality gap for the score
  let score = opportunity;

  // Quality bonus: high variance means quality can win
  if (quality.outlierRatio > 20) {
    score = Math.min(100, score + 10);
  }

  return {
    score,
    type,
    reasoning,
  };
}

function calculateDemandScore(
  metrics: MarketMetrics,
  gap: ContentGap,
  freshness: FreshnessAnalysis,
  trendsBoost?: TrendsBoost
): { score: number; band: DemandBand } {
  let score = 0;

  // Weight distribution (with Google Trends: 30/30/10/10/20, without: 40/35/15/10)
  const hasTrends = trendsBoost && trendsBoost.interestScore > 0;
  const viewWeight = hasTrends ? 6 : 8;      // Max 30 (with) or 40 (without)
  const gapWeight = hasTrends ? 0.30 : 0.35; // 30% or 35%
  const velocityWeight = hasTrends ? 3.33 : 5; // Max 10 or 15

  // Base demand from views - logarithmic scale
  const viewScore = Math.min(hasTrends ? 30 : 40, Math.log10(Math.max(1, metrics.avgViews)) * viewWeight);
  score += viewScore;

  // Content gap opportunity
  score += gap.score * gapWeight;

  // Velocity bonus
  const velocityScore = Math.min(hasTrends ? 10 : 15, Math.log10(Math.max(1, metrics.avgViewsPerDay)) * velocityWeight);
  score += velocityScore;

  // Freshness/trending bonus (10% weight)
  if (freshness.isEmergingTopic) {
    score += 10;
  } else if (freshness.recentVideoAvgViews > metrics.avgViews) {
    score += 5;
  }

  // Google Trends boost (20% weight when available)
  if (trendsBoost) {
    // Interest level: 0-10 points based on Google Trends score (0-100)
    score += Math.min(10, trendsBoost.interestScore / 10);

    // Growth bonus: 0-5 points based on week-over-week growth
    if (trendsBoost.weekOverWeekGrowth > 50) {
      score += 5;
    } else if (trendsBoost.weekOverWeekGrowth > 20) {
      score += 3;
    } else if (trendsBoost.weekOverWeekGrowth > 0) {
      score += 1;
    }

    // Breakout bonus: 5 points for >5000% growth signals
    if (trendsBoost.isBreakout) {
      score += 5;
    }
  }

  score = Math.round(Math.max(0, Math.min(100, score)));

  let band: DemandBand;
  if (score >= 75) {
    band = 'hot';
  } else if (score >= 55) {
    band = 'growing';
  } else if (score >= 35) {
    band = 'stable';
  } else if (metrics.videoCount >= 3) {
    band = 'niche';
  } else {
    band = 'unknown';
  }

  // Cap band for saturated markets
  // "GROWING" or "HOT" implies opportunity, which is misleading for saturated markets
  if (gap.type === 'saturated' && (band === 'hot' || band === 'growing')) {
    band = 'stable';
  }

  return { score, band };
}

function generateOpportunities(
  metrics: MarketMetrics,
  quality: QualityDistribution,
  freshness: FreshnessAnalysis,
  gap: ContentGap,
  trendsBoost?: TrendsBoost
): ContentOpportunity[] {
  const opportunities: ContentOpportunity[] = [];

  // IMPORTANT: Don't show opportunity flags for saturated markets
  const isSaturated = gap.type === 'saturated';

  // Quality gap opportunity - only if market is NOT saturated
  if (!isSaturated && quality.outlierRatio > 15 && quality.bottomPerformerViews < quality.topPerformerViews * 0.1) {
    opportunities.push({
      type: 'quality_gap',
      title: 'Quality Opportunity',
      description: `Top videos average ${formatViews(quality.topPerformerViews)} views while most get ${formatViews(quality.bottomPerformerViews)}. High-quality content could capture significant audience.`,
      priority: quality.outlierRatio > 25 ? 'high' : 'medium',
    });
  }

  // Freshness gap opportunity - ONLY for non-saturated markets with genuine opportunity
  // The gap.type check is critical: saturated markets should NEVER show this
  if (!isSaturated && gap.type !== 'balanced' && freshness.recentVideoCount < 3 && metrics.avgViews > 30000 && metrics.avgViews < 300000 && metrics.videoCount < 15) {
    opportunities.push({
      type: 'freshness_gap',
      title: 'Content Freshness Gap',
      description: `Few recent uploads among top-ranking videos (${freshness.recentVideoCount} of ${metrics.videoCount} from last 90 days). With ${formatViews(metrics.avgViews)} avg views, new quality content could rank well.`,
      priority: 'high',
    });
  }

  // Underserved market opportunity - gap.type already computed with barrier/opportunity model
  if (gap.type === 'underserved') {
    opportunities.push({
      type: 'underserved',
      title: 'Good Opportunity',
      description: gap.reasoning,
      priority: 'high',
    });
  }

  // Emerging trend opportunity
  if (gap.type === 'emerging') {
    opportunities.push({
      type: 'trending',
      title: 'Emerging Trend',
      description: gap.reasoning,
      priority: 'high',
    });
  }

  // Trending topic based on freshness (backup if not already flagged as emerging)
  if (!isSaturated && gap.type !== 'emerging' && freshness.isEmergingTopic && freshness.recentVideoAvgViews > 10000) {
    opportunities.push({
      type: 'trending',
      title: 'Growing Topic',
      description: `${freshness.recentVideoCount} recent videos averaging ${formatViews(freshness.recentVideoAvgViews)} views. This topic is gaining momentum.`,
      priority: 'medium',
    });
  }

  // Google Trends breakout opportunity
  if (trendsBoost?.isBreakout) {
    opportunities.push({
      type: 'google_breakout',
      title: 'Google Trends Breakout',
      description: `This ingredient is experiencing explosive growth on Google (${trendsBoost.weekOverWeekGrowth > 100 ? '>100%' : `+${Math.round(trendsBoost.weekOverWeekGrowth)}%`} week-over-week). First-mover advantage available.`,
      priority: 'high',
    });
  }

  // Velocity mismatch: Google trending faster than YouTube supply
  if (trendsBoost && trendsBoost.weekOverWeekGrowth > 30 && freshness.recentVideoCount < 5 && !trendsBoost.isBreakout) {
    opportunities.push({
      type: 'velocity_mismatch',
      title: 'Search Demand Outpacing Content',
      description: `Google searches growing +${Math.round(trendsBoost.weekOverWeekGrowth)}% but only ${freshness.recentVideoCount} new videos in 90 days. Supply gap widening.`,
      priority: 'high',
    });
  }

  return opportunities;
}

function createUnknownSignal(): YouTubeDemandSignal {
  return {
    demandScore: 0,
    demandBand: 'unknown',
    marketMetrics: {
      totalViews: 0,
      avgViews: 0,
      medianViews: 0,
      avgViewsPerDay: 0,
      videoCount: 0,
    },
    contentGap: {
      score: 0,
      type: 'balanced',
      reasoning: 'Insufficient data to analyze demand.',
    },
    opportunities: [],
    confidence: 0,
    sampleSize: 0,
  };
}

/**
 * Calculate YouTube-based demand signal from video data
 * Uses only the data already fetched - zero additional API calls
 * Filters videos by relevance to searched ingredients
 * Optionally incorporates Google Trends data for enhanced accuracy
 */
export function calculateYouTubeDemandSignal(
  videos: YouTubeVideo[],
  ingredients: string[],
  trendsBoost?: TrendsBoost
): YouTubeDemandSignal {
  if (videos.length === 0) {
    return createUnknownSignal();
  }

  // Filter to videos matching a sufficient proportion of searched ingredients.
  // Single ingredient: require exact match (100%)
  // 2-3 ingredients: require 67% (allows 2/3 match since YouTube titles often omit some ingredients)
  // 4+ ingredients: require 50%
  const relevanceThreshold = ingredients.length <= 3
    ? (ingredients.length === 1 ? 1.0 : 0.67)
    : 0.5;
  const relevantVideos = videos.filter(video => {
    const relevance = calculateVideoRelevance(video, ingredients);
    return relevance >= relevanceThreshold;
  });

  // If fewer than 3 relevant videos, return niche/unknown
  if (relevantVideos.length < 3) {
    const baseSignal = createUnknownSignal();
    return {
      ...baseSignal,
      demandBand: relevantVideos.length > 0 ? 'niche' : 'unknown',
      contentGap: {
        score: relevantVideos.length > 0 ? 80 : 0,
        type: relevantVideos.length > 0 ? 'underserved' : 'balanced',
        reasoning: relevantVideos.length > 0
          ? `Only ${relevantVideos.length} video${relevantVideos.length > 1 ? 's' : ''} found for this combination. Potential opportunity.`
          : 'No videos found for this specific combination.',
      },
      opportunities: relevantVideos.length > 0 ? [{
        type: 'underserved' as OpportunityType,
        title: 'Untapped Combination',
        description: `Very few videos exist for this ingredient combination. This could be a unique content opportunity.`,
        priority: 'high' as OpportunityPriority,
      }] : [],
      sampleSize: relevantVideos.length,
    };
  }

  // Calculate metrics using only relevant videos
  const marketMetrics = calculateMarketMetrics(relevantVideos);
  const qualityDistribution = calculateQualityDistribution(relevantVideos);
  const freshnessAnalysis = calculateFreshnessAnalysis(relevantVideos);
  // Pass ingredient count for niche advantage calculation in opportunity score
  const contentGap = calculateContentGap(marketMetrics, qualityDistribution, freshnessAnalysis, ingredients.length, trendsBoost);
  const { score, band } = calculateDemandScore(marketMetrics, contentGap, freshnessAnalysis, trendsBoost);
  const opportunities = generateOpportunities(marketMetrics, qualityDistribution, freshnessAnalysis, contentGap, trendsBoost);

  // Confidence calculation:
  // - Base confidence from sample size (up to 0.6)
  // - Video metrics add up to 0.2
  // - Google Trends validation adds up to 0.2
  let confidence = Math.min(0.6, relevantVideos.length / 25);

  // Boost confidence if we have good video metrics
  if (marketMetrics.avgViews > 10000) {
    confidence += 0.1;
  }
  if (marketMetrics.videoCount >= 10) {
    confidence += 0.1;
  }

  // Boost confidence with Google Trends validation
  if (trendsBoost && trendsBoost.interestScore > 0) {
    confidence += 0.1;
    if (trendsBoost.interestScore > 50) {
      confidence += 0.1;
    }
  }

  confidence = Math.min(1, confidence);

  return {
    demandScore: score,
    demandBand: band,
    marketMetrics,
    contentGap,
    opportunities,
    confidence,
    sampleSize: relevantVideos.length,
    trendsBoost,
  };
}
