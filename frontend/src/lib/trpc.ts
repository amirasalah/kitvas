// tRPC router types
// Import the actual router type from backend
import type { AppRouter } from '@kitvas/backend/src/router'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

// Re-export the router type
export type { AppRouter }

// Video result type (matches backend response for analyzed videos)
// Note: publishedAt is string because JSON serialization converts Date to ISO string
export type VideoTag = {
  tag: string
  category: string // 'cooking_method' | 'dietary' | 'cuisine'
}

export type VideoResult = {
  id: string
  youtubeId: string
  title: string
  description: string | null
  thumbnailUrl: string
  publishedAt: string
  views: number | null
  relevanceScore: number
  ingredients: Array<{
    id: string
    name: string
    confidence: number
    source: string
  }>
  tags?: VideoTag[]
}

// Fresh YouTube video result (no ingredient data yet)
export type YouTubeVideoResult = {
  youtubeId: string
  title: string
  description: string | null
  thumbnailUrl: string
  publishedAt: string
  views: number | null
}

// YouTube market-based demand signal types
export type DemandBand = 'hot' | 'growing' | 'stable' | 'niche' | 'unknown'
export type ContentGapType = 'underserved' | 'saturated' | 'balanced' | 'emerging'
export type OpportunityType = 'quality_gap' | 'freshness_gap' | 'underserved' | 'trending'
export type OpportunityPriority = 'high' | 'medium' | 'low'

export type ContentGap = {
  score: number
  type: ContentGapType
  reasoning: string
}

export type ContentOpportunity = {
  type: OpportunityType
  title: string
  description: string
  priority: OpportunityPriority
}

export type DemandSignal = {
  demandScore: number
  avgViews: number
  medianViews: number
  avgViewsPerDay: number
  videoCount: number
  contentGap: ContentGap
  confidence: number
}

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>
