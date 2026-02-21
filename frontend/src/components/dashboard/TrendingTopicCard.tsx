'use client'

type TrendingTopic = {
  id: string
  topic: string
  trendScore: number
  sources: string[]
  mentionCount: number
  growthPct: number | null
  isBreakout: boolean
  youtubeCount: number
  webCount: number
}

const SOURCE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  youtube: { bg: 'bg-red-100', text: 'text-red-700', label: 'YT' },
  web: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'W' },
}

export function TrendingTopicCard({
  topic,
  rank,
}: {
  topic: TrendingTopic
  rank: number
}) {
  const growth = topic.growthPct
  const growthText = growth != null
    ? growth > 0
      ? `+${Math.round(growth)}%`
      : `${Math.round(growth)}%`
    : null

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/60 transition-colors">
      <span className="text-sm font-medium text-gray-400 w-6 text-right">
        {rank}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate capitalize">
            {topic.topic}
          </span>
          {topic.isBreakout && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded animate-pulse">
              BREAKOUT
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          {/* Source badges */}
          <div className="flex items-center gap-1">
            {topic.sources.map(source => {
              const style = SOURCE_COLORS[source]
              if (!style) return null
              return (
                <span
                  key={source}
                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${style.bg} ${style.text}`}
                >
                  {style.label}
                </span>
              )
            })}
          </div>

          {/* Mentions */}
          <span className="text-xs text-gray-400">
            {topic.mentionCount} mentions
          </span>
        </div>
      </div>

      {/* Score + growth */}
      <div className="text-right shrink-0">
        <div className="text-sm font-semibold text-gray-900">
          {Math.round(topic.trendScore)}
        </div>
        {growthText && (
          <div
            className={`text-xs font-medium ${
              growth! > 0 ? 'text-emerald-600' : growth! < 0 ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            {growthText}
          </div>
        )}
      </div>
    </div>
  )
}
