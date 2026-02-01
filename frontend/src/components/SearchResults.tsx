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
import { IngredientGaps } from './IngredientGaps'

interface SearchResultsProps {
  analyzedVideos: VideoResult[]
  youtubeVideos: YouTubeVideoResult[]
  demand: DemandBand
  demandSignal?: DemandSignal
  rateLimitRemaining?: number
  opportunities: ContentOpportunity[]
  ingredients: string[]
  lowRelevanceFallback?: boolean
  onAddIngredient?: (ingredient: string) => void
}

export function SearchResults({
  analyzedVideos,
  youtubeVideos,
  demand,
  demandSignal,
  rateLimitRemaining,
  opportunities,
  ingredients,
  lowRelevanceFallback,
  onAddIngredient,
}: SearchResultsProps) {
  const hasNoResults = analyzedVideos.length === 0 && youtubeVideos.length === 0

  if (hasNoResults) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No videos found</h3>
        <p className="text-gray-500">Try different ingredients or fewer filters</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Demand Signal Card */}
      <DemandBadge demand={demand} demandSignal={demandSignal} rateLimitRemaining={rateLimitRemaining} />

      {/* Ingredient Gap Opportunities */}
      {ingredients.length >= 1 && (
        <IngredientGaps ingredients={ingredients} onAddIngredient={onAddIngredient} />
      )}

      {/* Opportunities Section */}
      {opportunities.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Opportunities</h2>
              <p className="text-sm text-gray-500">Content gaps you could fill</p>
            </div>
          </div>
          <div className="space-y-3">
            {opportunities.map((opp, index) => (
              <OpportunityCard key={index} opportunity={opp} ingredients={ingredients} />
            ))}
          </div>
        </section>
      )}

      {/* Fresh YouTube Videos */}
      {youtubeVideos.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Fresh from YouTube</h2>
              <p className="text-sm text-gray-500">Being analyzed in the background</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {youtubeVideos.map((video) => (
              <YouTubeVideoCard key={video.youtubeId} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* Analyzed Videos */}
      {analyzedVideos.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Analyzed Videos</h2>
              <p className="text-sm text-gray-500">With AI-detected ingredients</p>
            </div>
          </div>
          {lowRelevanceFallback && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <span className="font-medium">Note:</span> No exact matches found. Showing partially matching videos.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {analyzedVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
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
  rateLimitRemaining,
}: {
  demand: DemandBand
  demandSignal?: DemandSignal
  rateLimitRemaining?: number
}) {
  const demandConfig: Record<DemandBand, { color: string; bgColor: string; label: string; icon: string }> = {
    hot: { color: 'text-red-700', bgColor: 'bg-red-50 border-red-200', label: 'HOT', icon: '🔥' },
    growing: { color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200', label: 'GROWING', icon: '📈' },
    stable: { color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', label: 'STABLE', icon: '📊' },
    niche: { color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200', label: 'NICHE', icon: '💎' },
    unknown: { color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200', label: 'UNKNOWN', icon: '❓' },
  }

  const config = demandConfig[demand]

  const getConfidenceInfo = (confidence: number) => {
    if (confidence >= 0.8) return { label: 'High confidence', color: 'text-green-600', bg: 'bg-green-50' }
    if (confidence >= 0.5) return { label: 'Medium confidence', color: 'text-amber-600', bg: 'bg-amber-50' }
    return { label: 'Low confidence', color: 'text-orange-600', bg: 'bg-orange-50' }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="flex flex-wrap items-center gap-4">
        {/* Demand Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${config.bgColor}`}>
          <span className="text-lg">{config.icon}</span>
          <span className={`font-bold ${config.color}`}>{config.label}</span>
          {demandSignal && (
            <span className={`text-sm ${config.color} opacity-75`}>{demandSignal.demandScore}/100</span>
          )}
        </div>

        {/* Metrics */}
        {demandSignal && demandSignal.avgViews > 0 && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-gray-600">{formatViews(demandSignal.avgViews)} avg views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-gray-600">{formatViews(demandSignal.avgViewsPerDay)}/day</span>
            </div>
          </div>
        )}

        {/* Confidence */}
        {demandSignal && demandSignal.confidence !== undefined && (
          <div className={`px-3 py-1 rounded-lg text-xs font-medium ${getConfidenceInfo(demandSignal.confidence).bg} ${getConfidenceInfo(demandSignal.confidence).color}`}>
            {getConfidenceInfo(demandSignal.confidence).label}
            <span className="opacity-60 ml-1">(n={demandSignal.videoCount})</span>
          </div>
        )}

        {/* Rate Limit Warning */}
        {rateLimitRemaining !== undefined && rateLimitRemaining < 5 && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
            {rateLimitRemaining} searches left
          </span>
        )}
      </div>

      {/* Content Gap Analysis */}
      {demandSignal && demandSignal.contentGap && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-start gap-2">
            <span className={`font-semibold ${
              demandSignal.contentGap.type === 'underserved' ? 'text-green-600' :
              demandSignal.contentGap.type === 'emerging' ? 'text-orange-600' :
              demandSignal.contentGap.type === 'saturated' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {demandSignal.contentGap.type === 'underserved' ? '✓ Underserved market' :
               demandSignal.contentGap.type === 'emerging' ? '⚡ Emerging trend' :
               demandSignal.contentGap.type === 'saturated' ? '⚠ Saturated market' :
               '○ Balanced competition'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{demandSignal.contentGap.reasoning}</p>
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
    <div className="card card-hover overflow-hidden group">
      <a
        href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative"
      >
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
          {(video.relevanceScore * 100).toFixed(0)}% match
        </div>
      </a>
      <div className="p-4">
        <a
          href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block group-hover:text-[#10B981] transition-colors"
        >
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{video.title}</h3>
        </a>

        <p className="text-sm text-gray-500 mb-3">
          {video.views ? `${video.views.toLocaleString()} views` : 'No view data'}
        </p>

        {/* Ingredients */}
        {video.ingredients && video.ingredients.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
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
                className="text-xs text-[#10B981] hover:underline"
              >
                {showAllIngredients ? 'Show less' : `+${video.ingredients.length - 5} more`}
              </button>
            )}
          </div>
        )}

        {correctionFeedback && (
          <div className="mt-3 text-xs p-2 bg-blue-50 text-blue-700 rounded-lg">
            {correctionFeedback}
          </div>
        )}

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
            {video.tags.map((tag) => (
              <span
                key={tag.tag}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  tag.category === 'cooking_method'
                    ? 'bg-purple-50 text-purple-600'
                    : tag.category === 'dietary'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-orange-50 text-orange-600'
                }`}
              >
                {tag.tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function YouTubeVideoCard({ video }: { video: YouTubeVideoResult }) {
  const [showAnalyzing, setShowAnalyzing] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowAnalyzing(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="card card-hover overflow-hidden group">
      <a
        href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative"
      >
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
      <div className="p-4">
        <a
          href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block group-hover:text-[#10B981] transition-colors"
        >
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{video.title}</h3>
        </a>

        <p className="text-sm text-gray-500 mb-3">
          {video.views ? `${video.views.toLocaleString()} views` : 'No view data'}
        </p>

        {showAnalyzing && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs">
            <div className="w-3 h-3 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin"></div>
            Queued for analysis
          </div>
        )}
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

  const confidenceLevel = ingredient.confidence >= 0.8 ? 'high' : ingredient.confidence >= 0.5 ? 'medium' : 'low'
  const confidenceStyles = {
    high: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    medium: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    low: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={() => setShowActions(!showActions)}
        disabled={isLoading}
        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${confidenceStyles[confidenceLevel]}`}
      >
        {ingredient.name}
      </button>

      {showActions && !isLoading && (
        <div className="absolute top-full left-0 mt-1 flex gap-1 bg-white shadow-lg rounded-lg border p-1 z-20">
          <button
            onClick={() => { onCorrection('right'); setShowActions(false) }}
            className="text-xs px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 whitespace-nowrap"
          >
            ✓ Correct
          </button>
          <button
            onClick={() => { onCorrection('wrong'); setShowActions(false) }}
            className="text-xs px-2.5 py-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100 whitespace-nowrap"
          >
            ✗ Wrong
          </button>
        </div>
      )}
    </div>
  )
}

function OpportunityCard({
  opportunity,
  ingredients,
}: {
  opportunity: ContentOpportunity
  ingredients: string[]
}) {
  const [trackFeedback, setTrackFeedback] = useState<string | null>(null)

  const trackMutation = trpc.opportunities.track.useMutation({
    onSuccess: (data) => {
      setTrackFeedback(data.message)
      setTimeout(() => setTrackFeedback(null), 4000)
    },
    onError: (error) => {
      setTrackFeedback(`Error: ${error.message}`)
      setTimeout(() => setTrackFeedback(null), 4000)
    },
  })

  const handleTrack = () => {
    trackMutation.mutate({
      ingredients,
      opportunityScore: opportunity.priority,
      opportunityType: opportunity.type,
      title: opportunity.title,
    })
  }

  const priorityConfig = {
    high: { border: 'border-l-green-500', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700' },
    medium: { border: 'border-l-amber-500', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
    low: { border: 'border-l-gray-400', bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-600' },
  }

  const config = priorityConfig[opportunity.priority]

  return (
    <div className={`p-4 rounded-xl border-l-4 ${config.border} ${config.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900">{opportunity.title}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badge}`}>
              {opportunity.priority}
            </span>
          </div>
          <p className="text-sm text-gray-600">{opportunity.description}</p>
        </div>
        <button
          onClick={handleTrack}
          disabled={trackMutation.isPending}
          className="btn-primary text-sm px-4 py-2 flex-shrink-0"
        >
          {trackMutation.isPending ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
          ) : (
            'Track'
          )}
        </button>
      </div>
      {trackFeedback && (
        <div className={`mt-3 text-xs p-2 rounded-lg ${
          trackFeedback.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {trackFeedback}
        </div>
      )}
    </div>
  )
}
