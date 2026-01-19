'use client'

import type { VideoResult } from '@/lib/trpc'

interface SearchResultsProps {
  videos: VideoResult[]
  demand: 'high' | 'medium' | 'low' | 'unknown'
  opportunities: any[]
}

export function SearchResults({
  videos,
  demand,
  opportunities,
}: SearchResultsProps) {
  if (videos.length === 0) {
    return (
      <div className="mt-8 p-8 text-center text-gray-500">
        <p>No videos found. Try different ingredients.</p>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Search Results</h2>
        <div className="mb-4">
          <span className="text-sm text-gray-600">Demand: </span>
          <span
            className={`font-medium ${
              demand === 'high'
                ? 'text-green-600'
                : demand === 'medium'
                ? 'text-yellow-600'
                : demand === 'low'
                ? 'text-red-600'
                : 'text-gray-600'
            }`}
          >
            {demand.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                {video.title}
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {video.views ? `${video.views.toLocaleString()} views` : 'No view data'}
                </p>
                {video.ingredients && video.ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {video.ingredients.slice(0, 3).map((ing) => (
                      <span
                        key={ing.id}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                      >
                        {ing.name}
                      </span>
                    ))}
                    {video.ingredients.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{video.ingredients.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Relevance: {(video.relevanceScore * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {opportunities.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Opportunities</h2>
          <div className="space-y-4">
            {opportunities.map((opp, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <p className="font-medium">{opp.title}</p>
                <p className="text-sm text-gray-600 mt-1">{opp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
