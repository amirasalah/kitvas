'use client'

import { useState } from 'react'
import { trpc } from '@/app/providers'

type Period = 'today' | 'week' | 'month'

interface TrendingIngredientsProps {
  onIngredientClick?: (ingredient: string) => void
}

export function TrendingIngredients({ onIngredientClick }: TrendingIngredientsProps) {
  const [period, setPeriod] = useState<Period>('week')

  const { data, isLoading, error } = trpc.analytics.hotIngredients.useQuery(
    { period, limit: 10 },
    { staleTime: 5 * 60 * 1000 } // Cache for 5 minutes
  )

  // Track if we have any Google Trends data at all (for any period)
  const hasAnyData = data?.hasGoogleTrends || (data?.ingredients && data.ingredients.length > 0)

  // Don't show if we've never had any Google Trends data
  // But DO show if we have data for other periods (just not the selected one)
  if (!isLoading && !hasAnyData && period === 'week') {
    // Only hide on initial load with 'week' - if user switched periods, keep showing
    return null
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-6 mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md">
            <span className="text-xl">🔥</span>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">What's Hot</h2>
            <p className="text-sm text-gray-500">Trending ingredients on Google</p>
          </div>
        </div>

        {/* Period Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <PeriodTab
            label="Today"
            value="today"
            current={period}
            onClick={() => setPeriod('today')}
          />
          <PeriodTab
            label="This Week"
            value="week"
            current={period}
            onClick={() => setPeriod('week')}
          />
          <PeriodTab
            label="This Month"
            value="month"
            current={period}
            onClick={() => setPeriod('month')}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4">
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              <div className="flex-1 h-4 bg-gray-200 rounded"></div>
              <div className="w-12 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-4 text-gray-500">
          <p>Unable to load trending data</p>
        </div>
      )}

      {/* Empty State for selected period */}
      {!isLoading && !error && data && data.ingredients.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No trending data for {period === 'today' ? 'today' : period === 'week' ? 'this week' : 'this month'} yet.</p>
          <p className="text-xs mt-1 text-gray-400">Try selecting a different time period.</p>
        </div>
      )}

      {/* Ingredients List */}
      {data && data.ingredients.length > 0 && (
        <div className="space-y-2">
          {data.ingredients.map((ingredient, index) => (
            <IngredientRow
              key={ingredient.name}
              rank={index + 1}
              name={ingredient.name}
              interest={ingredient.interest}
              growth={ingredient.growth}
              isBreakout={ingredient.isBreakout}
              onClick={() => onIngredientClick?.(ingredient.name)}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        Data from Google Trends • Updated daily
      </p>
    </div>
  )
}

function PeriodTab({
  label,
  value,
  current,
  onClick,
}: {
  label: string
  value: Period
  current: Period
  onClick: () => void
}) {
  const isActive = value === current

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
    </button>
  )
}

function IngredientRow({
  rank,
  name,
  interest,
  growth,
  isBreakout,
  onClick,
}: {
  rank: number
  name: string
  interest: number
  growth: number
  isBreakout: boolean
  onClick?: () => void
}) {
  // Determine growth indicator
  let growthIndicator = ''
  let growthColor = 'text-gray-500'

  if (growth > 10) {
    growthIndicator = `↑ +${growth}%`
    growthColor = 'text-green-600'
  } else if (growth < -10) {
    growthIndicator = `↓ ${growth}%`
    growthColor = 'text-red-500'
  } else {
    growthIndicator = '→ stable'
    growthColor = 'text-gray-400'
  }

  // Rank badge color
  const rankColors = [
    'bg-amber-100 text-amber-700', // 1st
    'bg-gray-100 text-gray-600',   // 2nd
    'bg-orange-100 text-orange-600', // 3rd
  ]
  const rankColor = rank <= 3 ? rankColors[rank - 1] : 'bg-gray-50 text-gray-500'

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-50 transition-colors group text-left"
    >
      {/* Rank */}
      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${rankColor}`}>
        {rank}
      </span>

      {/* Name */}
      <span className="flex-1 font-medium text-gray-900 group-hover:text-[#10B981] group-active:text-[#10B981] transition-colors capitalize">
        {name}
      </span>

      {/* Breakout Badge */}
      {isBreakout && (
        <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full animate-pulse">
          BREAKOUT
        </span>
      )}

      {/* Interest Score */}
      <div className="flex items-center gap-1">
        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all"
            style={{ width: `${interest}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 w-8">{interest}</span>
      </div>

      {/* Growth */}
      <span className={`text-xs font-medium w-20 text-right ${growthColor}`}>
        {growthIndicator}
      </span>
    </button>
  )
}
