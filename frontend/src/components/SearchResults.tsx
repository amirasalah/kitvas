'use client'

import { useState, useEffect, useRef } from 'react'
import { trpc } from '@/app/providers'
import type {
  VideoResult,
  YouTubeVideoResult,
  DemandBand,
  DemandSignal,
  ContentOpportunity,
} from '@/lib/trpc'

interface SearchResultsProps {
  analyzedVideos: VideoResult[]
  youtubeVideos: YouTubeVideoResult[]
  demand: DemandBand
  demandSignal?: DemandSignal
  rateLimitRemaining?: number
  opportunities: ContentOpportunity[]
}

export function SearchResults({
  analyzedVideos,
  youtubeVideos,
  demand,
  demandSignal,
  rateLimitRemaining,
  opportunities,
}: SearchResultsProps) {
  const hasNoResults = analyzedVideos.length === 0 && youtubeVideos.length === 0

  if (hasNoResults) {
    return (
      <div className="mt-8 p-8 text-center text-gray-500">
        <p>No videos found. Try different ingredients.</p>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Demand Signal */}
      <div className="flex items-center justify-between">
        <DemandBadge demand={demand} demandSignal={demandSignal} />
        {rateLimitRemaining !== undefined && rateLimitRemaining < 5 && (
          <span className="text-xs text-gray-500">
            {rateLimitRemaining} YouTube searches remaining this hour
          </span>
        )}
      </div>

      {/* Analyzed Videos Section */}
      {analyzedVideos.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold">Analyzed Videos</h2>
            <p className="text-sm text-gray-500">With ingredient detection</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyzedVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* Fresh YouTube Videos Section */}
      {youtubeVideos.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold">More from YouTube</h2>
            <p className="text-sm text-gray-500">
              Fresh results (analyzing ingredients in background...)
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {youtubeVideos.map((video) => (
              <YouTubeVideoCard key={video.youtubeId} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* Opportunities Section */}
      {opportunities.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Opportunities</h2>
          <div className="space-y-3">
            {opportunities.map((opp, index) => {
              const priorityStyles = {
                high: 'border-l-green-500 bg-green-50',
                medium: 'border-l-yellow-500 bg-yellow-50',
                low: 'border-l-gray-400 bg-gray-50',
              }
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${priorityStyles[opp.priority]}`}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{opp.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      opp.priority === 'high' ? 'bg-green-200 text-green-800' :
                      opp.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {opp.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{opp.description}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function formatViews(views: number): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
  return views.toString()
}

function DemandBadge({
  demand,
  demandSignal,
}: {
  demand: DemandBand
  demandSignal?: DemandSignal
}) {
  const demandConfig: Record<DemandBand, { color: string; label: string }> = {
    hot: { color: 'bg-red-100 text-red-800 border-red-200', label: 'HOT' },
    growing: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'GROWING' },
    stable: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'STABLE' },
    niche: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'NICHE' },
    unknown: { color: 'bg-gray-100 text-gray-600 border-gray-200', label: 'UNKNOWN' },
  }

  const config = demandConfig[demand]

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-2">
      <div className="flex items-center gap-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${config.color}`}>
          <span className="font-semibold">{config.label}</span>
          {demandSignal && (
            <span className="text-sm opacity-75">{demandSignal.demandScore}/100</span>
          )}
        </div>
        {demandSignal && demandSignal.avgViews > 0 && (
          <div className="text-sm text-gray-600">
            <span>Avg views: {formatViews(demandSignal.avgViews)}</span>
            <span className="mx-2">·</span>
            <span>{formatViews(demandSignal.avgViewsPerDay)} views/day</span>
          </div>
        )}
      </div>
      {demandSignal && demandSignal.contentGap && (
        <div className="text-sm">
          <span className={`font-medium ${
            demandSignal.contentGap.type === 'underserved' ? 'text-green-600' :
            demandSignal.contentGap.type === 'emerging' ? 'text-orange-600' :
            demandSignal.contentGap.type === 'saturated' ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {demandSignal.contentGap.type === 'underserved' ? 'Underserved market' :
             demandSignal.contentGap.type === 'emerging' ? 'Emerging trend' :
             demandSignal.contentGap.type === 'saturated' ? 'Saturated market' :
             'Balanced competition'}
          </span>
          <span className="text-gray-500"> - {demandSignal.contentGap.reasoning}</span>
        </div>
      )}
    </div>
  )
}

function VideoCard({ video }: { video: VideoResult }) {
  const [showAllIngredients, setShowAllIngredients] = useState(false)
  const [correctionFeedback, setCorrectionFeedback] = useState<string | null>(null)

  const correctionMutation = trpc.corrections.submit.useMutation({
    onSuccess: (data) => {
      setCorrectionFeedback(data.message)
      setTimeout(() => setCorrectionFeedback(null), 3000)
    },
    onError: (error) => {
      setCorrectionFeedback(`Error: ${error.message}`)
      setTimeout(() => setCorrectionFeedback(null), 3000)
    },
  })

  const handleCorrection = (ingredientId: string, action: 'wrong' | 'right') => {
    correctionMutation.mutate({
      videoId: video.id,
      ingredientId,
      action,
    })
  }

  const displayedIngredients = showAllIngredients
    ? video.ingredients
    : video.ingredients.slice(0, 5)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <a
        href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-48 object-cover"
        />
      </a>
      <div className="p-4">
        <a
          href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {video.title}
          </h3>
        </a>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            {video.views ? `${video.views.toLocaleString()} views` : 'No view data'}
          </p>

          {video.ingredients && video.ingredients.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase">
                Detected Ingredients
              </p>
              <div className="flex flex-wrap gap-1">
                {displayedIngredients.map((ing) => (
                  <IngredientTag
                    key={ing.id}
                    ingredient={ing}
                    onCorrection={(action) => handleCorrection(ing.id, action)}
                    isLoading={correctionMutation.isPending}
                  />
                ))}
              </div>
              {video.ingredients.length > 5 && (
                <button
                  onClick={() => setShowAllIngredients(!showAllIngredients)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {showAllIngredients
                    ? 'Show less'
                    : `+${video.ingredients.length - 5} more`}
                </button>
              )}
            </div>
          )}

          {correctionFeedback && (
            <div className="text-xs p-2 bg-blue-50 text-blue-700 rounded">
              {correctionFeedback}
            </div>
          )}

          <p className="text-xs text-gray-500">
            Relevance: {(video.relevanceScore * 100).toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Card for fresh YouTube videos (no ingredient data yet)
 */
function YouTubeVideoCard({ video }: { video: YouTubeVideoResult }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-gray-50">
      <a
        href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-48 object-cover"
        />
      </a>
      <div className="p-4">
        <a
          href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {video.title}
          </h3>
        </a>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            {video.views ? `${video.views.toLocaleString()} views` : 'No view data'}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded">
              <svg className="w-3 h-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="3" />
              </svg>
              Analyzing ingredients...
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function IngredientTag({
  ingredient,
  onCorrection,
  isLoading,
}: {
  ingredient: { id: string; name: string; confidence: number; source: string }
  onCorrection: (action: 'wrong' | 'right') => void
  isLoading: boolean
}) {
  const [showActions, setShowActions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    if (!showActions) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowActions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showActions])

  // Confidence indicator (visual dots)
  const confidenceDots = Math.round(ingredient.confidence * 5)

  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowActions(!showActions)
  }

  const handleAction = (action: 'wrong' | 'right') => {
    onCorrection(action)
    setShowActions(false)
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={handleTagClick}
        disabled={isLoading}
        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
          ingredient.confidence >= 0.8
            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
            : ingredient.confidence >= 0.5
            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
        }`}
      >
        {ingredient.name}
        <span className="opacity-50 text-[10px]" title={`Confidence: ${(ingredient.confidence * 100).toFixed(0)}%`}>
          {'●'.repeat(confidenceDots)}{'○'.repeat(5 - confidenceDots)}
        </span>
      </button>

      {showActions && !isLoading && (
        <div className="absolute top-full left-0 mt-1 flex gap-1 bg-white shadow-lg rounded border p-1 z-20">
          <button
            onClick={() => handleAction('right')}
            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
            title="This ingredient is correct"
          >
            ✓ Correct
          </button>
          <button
            onClick={() => handleAction('wrong')}
            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 whitespace-nowrap"
            title="This ingredient is wrong"
          >
            ✗ Wrong
          </button>
        </div>
      )}
    </div>
  )
}
