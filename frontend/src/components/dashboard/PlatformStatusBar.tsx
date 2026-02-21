'use client'

type PlatformSource = {
  platform: string
  lastFetchedAt: string | null
  lastStatus: string | null
  itemsFetched: number
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: 'bg-red-500',
  reddit: 'bg-orange-500',
  x: 'bg-gray-900',
  web: 'bg-blue-500',
}

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  reddit: 'Reddit',
  x: 'X / Twitter',
  web: 'Websites',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function PlatformStatusBar({ sources }: { sources: PlatformSource[] }) {
  if (!sources || sources.length === 0) {
    return (
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>No data sources configured yet</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {sources.map(source => (
        <div key={source.platform} className="flex items-center gap-1.5 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              source.lastStatus === 'success'
                ? PLATFORM_COLORS[source.platform] || 'bg-gray-400'
                : source.lastStatus === 'error'
                  ? 'bg-red-400'
                  : 'bg-gray-300'
            }`}
          />
          <span className="text-gray-500">
            {PLATFORM_LABELS[source.platform] || source.platform}
          </span>
          <span className="text-gray-400">
            {source.lastFetchedAt ? timeAgo(source.lastFetchedAt) : 'pending'}
          </span>
        </div>
      ))}
    </div>
  )
}
