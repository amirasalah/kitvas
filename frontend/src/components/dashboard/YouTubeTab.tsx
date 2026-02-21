'use client'

import { trpc } from '@/app/providers'
import type { Period } from './TimePeriodSelector'

export function YouTubeTab({ period }: { period: Period }) {
  const { data: videos, isLoading } = trpc.dashboard.youtubeTrending.useQuery({ period })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-white/40 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">🎬</div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No trending videos yet</h3>
        <p className="text-sm text-gray-500">
          Videos will appear after the YouTube trending fetcher runs.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video: any) => (
        <a
          key={video.id}
          href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-white/50 rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all"
        >
          <div className="relative">
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full aspect-video object-cover"
            />
            {video.views != null && (
              <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded">
                {formatViews(video.views)} views
              </span>
            )}
          </div>
          <div className="p-3">
            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
              {video.title}
            </h4>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400">
                {new Date(video.publishedAt).toLocaleDateString()}
              </span>
            </div>
            {video.ingredients.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {video.ingredients.slice(0, 4).map((ing: string) => (
                  <span
                    key={ing}
                    className="px-1.5 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 rounded capitalize"
                  >
                    {ing}
                  </span>
                ))}
                {video.ingredients.length > 4 && (
                  <span className="text-[10px] text-gray-400">
                    +{video.ingredients.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        </a>
      ))}
    </div>
  )
}

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`
  return String(views)
}
