'use client'

import { useState } from 'react'
import { TimePeriodSelector, type Period } from './dashboard/TimePeriodSelector'
import { PlatformStatusBar } from './dashboard/PlatformStatusBar'
import { OverviewTab } from './dashboard/OverviewTab'
import { YouTubeTab } from './dashboard/YouTubeTab'
import { WebTab } from './dashboard/WebTab'
import { trpc } from '@/app/providers'

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'youtube', label: 'YouTube', icon: '🎬' },
  { id: 'websites', label: 'Websites', icon: '📰' },
] as const

type TabId = typeof TABS[number]['id']

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [period, setPeriod] = useState<Period>('24h')
  const { data: statusData } = trpc.dashboard.sourceStatus.useQuery()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Food Trend Dashboard</h1>
        <p className="text-sm text-gray-500">
          Real-time trending food content across YouTube and food publications
        </p>
      </div>

      {/* Controls: Tabs + Period + Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white/50 rounded-xl p-1 border border-gray-100">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Period selector */}
        <TimePeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Platform Status */}
      <div className="mb-6">
        <PlatformStatusBar sources={statusData || []} />
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <OverviewTab period={period} />}
        {activeTab === 'youtube' && <YouTubeTab period={period} />}
        {activeTab === 'websites' && <WebTab period={period} />}
      </div>
    </div>
  )
}
