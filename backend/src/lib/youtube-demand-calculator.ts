/**
 * YouTube Market-Based Demand Calculator
 * Calculates demand signals from YouTube video data (zero extra API calls)
 */

import type { YouTubeVideo } from './youtube.js';

export type DemandBand = 'hot' | 'growing' | 'stable' | 'niche' | 'unknown';
export type ContentGapType = 'underserved' | 'saturated' | 'balanced' | 'emerging';
export type OpportunityType = 'quality_gap' | 'freshness_gap' | 'underserved' | 'trending';
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

export interface YouTubeDemandSignal {
  demandScore: number;
  demandBand: DemandBand;
  marketMetrics: MarketMetrics;
  contentGap: ContentGap;
  opportunities: ContentOpportunity[];
  confidence: number;
  sampleSize: number;
}

function formatViews(views: number): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
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
  const matchCount = ingredients.filter(ing => text.includes(ing.toLowerCase())).length;
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

function calculateContentGap(
  metrics: MarketMetrics,
  quality: QualityDistribution,
  freshness: FreshnessAnalysis
): ContentGap {
  let score = 50;
  let type: ContentGapType = 'balanced';
  const reasons: string[] = [];

  // Factor 1: View concentration (high outlier ratio = opportunity)
  if (quality.outlierRatio > 20) {
    score += 15;
    reasons.push('Top videos significantly outperform average');
  } else if (quality.outlierRatio > 10) {
    score += 8;
  }

  // Factor 2: Supply vs Demand proxy
  if (metrics.avgViews > 100000 && metrics.videoCount < 15) {
    score += 25;
    type = 'underserved';
    reasons.push('High viewer demand but limited quality content');
  } else if (metrics.avgViews < 10000 && metrics.videoCount >= 18) {
    score -= 20;
    type = 'saturated';
    reasons.push('Many videos competing for limited interest');
  }

  // Factor 3: Freshness opportunity
  if (freshness.isEmergingTopic) {
    score += 15;
    if (type === 'balanced') type = 'emerging';
    reasons.push('Growing topic with increasing content creation');
  } else if (freshness.recentVideoCount < 3 && metrics.avgViews > 50000) {
    score += 20;
    type = 'underserved';
    reasons.push('High-performing older content dominates search results');
  }

  // Factor 4: Velocity
  if (metrics.avgViewsPerDay > 1000) {
    score += 10;
    reasons.push('Strong daily engagement');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    type,
    reasoning: reasons.length > 0 ? reasons.join('. ') + '.' : 'Balanced competition with moderate opportunity.',
  };
}

function calculateDemandScore(
  metrics: MarketMetrics,
  gap: ContentGap,
  freshness: FreshnessAnalysis
): { score: number; band: DemandBand } {
  let score = 0;

  // Base demand from views (40% weight) - logarithmic scale
  const viewScore = Math.min(40, Math.log10(Math.max(1, metrics.avgViews)) * 8);
  score += viewScore;

  // Content gap opportunity (35% weight)
  score += gap.score * 0.35;

  // Velocity bonus (15% weight)
  const velocityScore = Math.min(15, Math.log10(Math.max(1, metrics.avgViewsPerDay)) * 5);
  score += velocityScore;

  // Freshness/trending bonus (10% weight)
  if (freshness.isEmergingTopic) {
    score += 10;
  } else if (freshness.recentVideoAvgViews > metrics.avgViews) {
    score += 5;
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

  return { score, band };
}

function generateOpportunities(
  metrics: MarketMetrics,
  quality: QualityDistribution,
  freshness: FreshnessAnalysis,
  gap: ContentGap
): ContentOpportunity[] {
  const opportunities: ContentOpportunity[] = [];

  // Quality gap opportunity
  if (quality.outlierRatio > 15 && quality.bottomPerformerViews < quality.topPerformerViews * 0.1) {
    opportunities.push({
      type: 'quality_gap',
      title: 'Quality Opportunity',
      description: `Top videos average ${formatViews(quality.topPerformerViews)} views while most get ${formatViews(quality.bottomPerformerViews)}. High-quality content could capture significant audience.`,
      priority: quality.outlierRatio > 25 ? 'high' : 'medium',
    });
  }

  // Freshness gap opportunity
  if (freshness.recentVideoCount < 3 && metrics.avgViews > 30000) {
    opportunities.push({
      type: 'freshness_gap',
      title: 'Content Freshness Gap',
      description: `Few recent uploads among top-ranking videos (${freshness.recentVideoCount} of ${metrics.videoCount} from last 90 days). With ${formatViews(metrics.avgViews)} avg views, new quality content could rank well.`,
      priority: 'high',
    });
  }

  // Underserved market opportunity
  if (gap.type === 'underserved') {
    opportunities.push({
      type: 'underserved',
      title: 'Underserved Market',
      description: gap.reasoning,
      priority: 'high',
    });
  }

  // Trending topic opportunity
  if (freshness.isEmergingTopic && freshness.recentVideoAvgViews > 10000) {
    opportunities.push({
      type: 'trending',
      title: 'Emerging Trend',
      description: `${freshness.recentVideoCount} recent videos averaging ${formatViews(freshness.recentVideoAvgViews)} views. This topic is gaining momentum.`,
      priority: 'medium',
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
 */
export function calculateYouTubeDemandSignal(
  videos: YouTubeVideo[],
  ingredients: string[]
): YouTubeDemandSignal {
  if (videos.length === 0) {
    return createUnknownSignal();
  }

  // Filter to videos matching a sufficient proportion of searched ingredients.
  // For short ingredient lists (1-3), require ALL ingredients to match -
  // otherwise a search for "pasta, chocolate" would include generic "pasta" videos
  // and produce misleading demand signals.
  // For longer lists (4+), require at least 50%.
  const relevanceThreshold = ingredients.length <= 3
    ? 1.0
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
  const contentGap = calculateContentGap(marketMetrics, qualityDistribution, freshnessAnalysis);
  const { score, band } = calculateDemandScore(marketMetrics, contentGap, freshnessAnalysis);
  const opportunities = generateOpportunities(marketMetrics, qualityDistribution, freshnessAnalysis, contentGap);

  // Confidence based on relevant sample size (full at 15+ videos)
  const confidence = Math.min(1, relevantVideos.length / 15);

  return {
    demandScore: score,
    demandBand: band,
    marketMetrics,
    contentGap,
    opportunities,
    confidence,
    sampleSize: relevantVideos.length,
  };
}
