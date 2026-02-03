'use client'

import { trpc } from '@/app/providers'

interface IngredientTrendSparklineProps {
  ingredient: string
  period?: 'daily' | 'weekly' | 'monthly'
  showLabel?: boolean
  className?: string
}

export function IngredientTrendSparkline({
  ingredient,
  period = 'weekly',
  showLabel = true,
  className = '',
}: IngredientTrendSparklineProps) {
  const { data, isLoading, error } = trpc.analytics.ingredientTrends.useQuery(
    { ingredient, period, limit: 12 },
    { staleTime: 5 * 60 * 1000 } // Cache for 5 minutes
  )

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-20 h-4 bg-gray-200 animate-pulse rounded" />
      </div>
    )
  }

  if (error || !data || !data.found || data.trends.length === 0) {
    return null // Don't show anything if no data
  }

  const { trends, summary } = data

  // Calculate min/max for normalization
  const searchCounts = trends.map((t) => t.searchCount)
  const maxCount = Math.max(...searchCounts, 1)
  const minCount = Math.min(...searchCounts)

  // Generate sparkline bars
  const sparklineBars = trends.map((t, i) => {
    const normalizedHeight = maxCount > minCount
      ? ((t.searchCount - minCount) / (maxCount - minCount)) * 100
      : 50
    const height = Math.max(10, normalizedHeight) // Minimum 10% height

    return (
      <div
        key={i}
        className="flex-1 bg-emerald-400 rounded-t transition-all hover:bg-emerald-500"
        style={{ height: `${height}%` }}
        title={`${t.searchCount} searches`}
      />
    )
  })

  // Trend arrow indicator
  const trendIndicator = summary?.trendDirection === 'up' ? (
    <span className="text-green-600 text-xs font-medium flex items-center gap-0.5">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
      Up
    </span>
  ) : summary?.trendDirection === 'down' ? (
    <span className="text-red-500 text-xs font-medium flex items-center gap-0.5">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
      Down
    </span>
  ) : (
    <span className="text-gray-500 text-xs font-medium">Stable</span>
  )

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Sparkline visualization */}
      <div
        className="flex items-end gap-0.5 h-4 w-20"
        title={`${summary?.totalSearches || 0} total searches over ${trends.length} ${period === 'daily' ? 'days' : period === 'weekly' ? 'weeks' : 'months'}`}
      >
        {sparklineBars}
      </div>

      {/* Trend indicator */}
      {showLabel && trendIndicator}
    </div>
  )
}

/**
 * Compact version for use in search results
 */
export function IngredientTrendBadge({
  ingredient,
  className = '',
}: {
  ingredient: string
  className?: string
}) {
  const { data, isLoading } = trpc.analytics.ingredientTrends.useQuery(
    { ingredient, period: 'weekly', limit: 8 },
    { staleTime: 5 * 60 * 1000 }
  )

  if (isLoading || !data || !data.found || !data.summary) {
    return null
  }

  const { trendDirection, totalSearches } = data.summary

  if (totalSearches === 0) {
    return null
  }

  const badgeColor = trendDirection === 'up'
    ? 'bg-green-100 text-green-700 border-green-200'
    : trendDirection === 'down'
    ? 'bg-red-100 text-red-600 border-red-200'
    : 'bg-gray-100 text-gray-600 border-gray-200'

  const arrow = trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '→'

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${badgeColor} ${className}`}
      title={`${totalSearches} searches recently`}
    >
      {arrow} {trendDirection === 'stable' ? 'Stable' : trendDirection === 'up' ? 'Rising' : 'Falling'}
    </span>
  )
}

/**
 * Full trend card for detailed view
 */
export function IngredientTrendCard({
  ingredient,
  className = '',
}: {
  ingredient: string
  className?: string
}) {
  const { data, isLoading, error } = trpc.analytics.ingredientTrends.useQuery(
    { ingredient, period: 'weekly', limit: 12 },
    { staleTime: 5 * 60 * 1000 }
  )

  if (isLoading) {
    return (
      <div className={`p-4 bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-16 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (error || !data || !data.found) {
    return null
  }

  const { trends, summary } = data

  if (trends.length === 0 || !summary) {
    return null
  }

  // Generate chart bars
  const maxCount = Math.max(...trends.map((t) => t.searchCount), 1)

  return (
    <div className={`p-4 bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 capitalize">{ingredient}</h3>
        <IngredientTrendBadge ingredient={ingredient} />
      </div>

      {/* Chart */}
      <div className="flex items-end gap-1 h-16 mb-3">
        {trends.map((t, i) => {
          const height = (t.searchCount / maxCount) * 100
          return (
            <div
              key={i}
              className="flex-1 bg-emerald-400 hover:bg-emerald-500 rounded-t transition-colors cursor-default"
              style={{ height: `${Math.max(4, height)}%` }}
              title={`Week of ${new Date(t.periodStart).toLocaleDateString()}: ${t.searchCount} searches`}
            />
          )
        })}
      </div>

      {/* Stats */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>{summary.totalSearches} total searches</span>
        <span>{summary.totalVideos} videos</span>
        {summary.avgViews && <span>{Math.round(summary.avgViews / 1000)}K avg views</span>}
      </div>
    </div>
  )
}
