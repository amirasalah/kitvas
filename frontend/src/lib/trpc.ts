// tRPC router types
// Import the actual router type from backend
import type { AppRouter } from '@kitvas/backend/src/router'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

// Re-export the router type
export type { AppRouter }

// Video result type (matches backend response)
// Note: publishedAt is string because JSON serialization converts Date to ISO string
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
}

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>
