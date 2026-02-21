'use client'

import { trpc } from '@/app/providers'
import { TrendingTopicCard } from './TrendingTopicCard'
import type { Period } from './TimePeriodSelector'

export function OverviewTab({ period }: { period: Period }) {
  const { data, isLoading } = trpc.dashboard.overview.useQuery({ period })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/40 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white/40 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const topics = data?.topics || []

  if (topics.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No trending data yet</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Trending topics will appear here once the data fetchers have run.
          Run the aggregation script manually or wait for the scheduled jobs.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Trending Topics List */}
      <div className="lg:col-span-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Trending Topics
        </h3>
        <div className="bg-white/50 rounded-xl border border-gray-100 divide-y divide-gray-50">
          {topics.map((topic: any, index: number) => (
            <TrendingTopicCard key={topic.id} topic={topic} rank={index + 1} />
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Summary
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total Topics"
            value={topics.length}
            icon="📈"
          />
          <StatCard
            label="Breakouts"
            value={topics.filter((t: any) => t.isBreakout).length}
            icon="🔥"
          />
          <StatCard
            label="Multi-Platform"
            value={topics.filter((t: any) => t.sources.length >= 3).length}
            icon="🌐"
          />
          <StatCard
            label="Total Mentions"
            value={topics.reduce((sum: number, t: any) => sum + t.mentionCount, 0)}
            icon="💬"
          />
        </div>

        {/* Top breakouts */}
        {topics.filter((t: any) => t.isBreakout).length > 0 && (
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Breakout Ingredients</h4>
            <div className="space-y-1">
              {topics
                .filter((t: any) => t.isBreakout)
                .slice(0, 5)
                .map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span className="text-red-700 capitalize font-medium">{t.topic}</span>
                    <span className="text-red-500 text-xs">
                      {t.growthPct != null ? `+${Math.round(t.growthPct)}%` : 'NEW'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white/50 rounded-xl border border-gray-100 p-4 text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}
