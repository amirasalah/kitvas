'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { trpc } from '@/app/providers'
import type {
  VideoResult,
  YouTubeVideoResult,
  DemandBand,
  DemandSignal,
  ContentOpportunity,
} from '@/lib/trpc'
import { IngredientGaps } from './IngredientGaps'
import { ContentAngles } from './ContentAngles'
import { IngredientTrendSparkline } from './IngredientTrendSparkline'

interface SearchResultsProps {
  analyzedVideos: VideoResult[]
  youtubeVideos: YouTubeVideoResult[]
  demand: DemandBand
  demandSignal?: DemandSignal
  rateLimitRemaining?: number
  opportunities: ContentOpportunity[]
  ingredients: string[]
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
  onAddIngredient,
}: SearchResultsProps) {
  const { data: session, status } = useSession()
  const hasNoResults = analyzedVideos.length === 0 && youtubeVideos.length === 0
  const isLoggedIn = !!session
  const isLoading = status === 'loading'

  // Count what's available for the gate banner
  const hasDemandDetails = demandSignal && (demandSignal.avgViews > 0 || demandSignal.contentGap)
  const hasOpportunities = opportunities.length > 0
  const hasIngredientGaps = ingredients.length >= 1

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
      {/* Demand Signal Card - Basic badge always visible */}
      <DemandBadge
        demand={demand}
        demandSignal={demandSignal}
        rateLimitRemaining={rateLimitRemaining}
        showDetails={isLoggedIn}
      />

      {/* Premium Insights Section - Unified gate for non-logged-in users */}
      {!isLoggedIn && !isLoading && (hasDemandDetails || hasOpportunities || hasIngredientGaps) && (
        <div className="relative">
          {/* Blurred content preview */}
          <div className="blur-md select-none pointer-events-none space-y-6">
            {/* Demand Details Preview */}
            {hasDemandDetails && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    <span className="text-gray-600">125K avg views</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    <span className="text-gray-600">2.5K/day</span>
                  </div>
                  <span className="px-3 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-600">
                    High confidence
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="font-semibold text-green-600">✓ Underserved market</span>
                  <p className="text-sm text-gray-500 mt-1">This combination has high demand but limited quality content.</p>
                </div>
              </div>
            )}

            {/* Ingredient Gaps Preview */}
            {hasIngredientGaps && (
              <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 rounded-2xl border border-purple-100 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100"></div>
                  <div>
                    <h3 className="font-bold text-purple-900">Content Opportunities</h3>
                    <p className="text-sm text-purple-600">Based on 150 related searches</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="px-4 py-2.5 bg-white rounded-xl border border-purple-200">
                    <span className="font-semibold text-purple-900">+garlic</span>
                  </div>
                  <div className="px-4 py-2.5 bg-white rounded-xl border border-purple-200">
                    <span className="font-semibold text-purple-900">+lemon</span>
                  </div>
                  <div className="px-4 py-2.5 bg-white rounded-xl border border-purple-200">
                    <span className="font-semibold text-purple-900">+herbs</span>
                  </div>
                </div>
              </div>
            )}

            {/* Opportunities Preview */}
            {hasOpportunities && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100"></div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Opportunities</h2>
                    <p className="text-sm text-gray-500">Content gaps you could fill</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl border-l-4 border-l-green-500 bg-green-50">
                  <p className="font-semibold text-gray-900">Quick weeknight dinner version</p>
                  <p className="text-sm text-gray-600">Most videos are 20+ min. A 10-min version could fill this gap.</p>
                </div>
              </div>
            )}
          </div>

          {/* Overlay with CTA Banner */}
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px] rounded-2xl">
            <div className="text-center p-8 max-w-md">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Unlock Full Insights</h3>
              <p className="text-gray-600 mb-4">Sign in to access:</p>
              <ul className="text-left space-y-2 mb-6 mx-auto inline-block">
                {hasDemandDetails && (
                  <li className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5 text-[#10B981] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Detailed demand analytics & market analysis</span>
                  </li>
                )}
                {hasIngredientGaps && (
                  <li className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5 text-[#10B981] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Ingredient suggestions with gap scores</span>
                  </li>
                )}
                {hasOpportunities && (
                  <li className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5 text-[#10B981] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{opportunities.length} content {opportunities.length === 1 ? 'opportunity' : 'opportunities'} to explore</span>
                  </li>
                )}
              </ul>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-[#10B981] hover:bg-[#059669] rounded-xl transition-colors shadow-lg shadow-green-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
                </svg>
                Sign in with Google
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Show actual content for logged-in users */}
      {isLoggedIn && (
        <>
          {/* Ingredient Gap Opportunities */}
          {ingredients.length >= 1 && (
            <IngredientGaps ingredients={ingredients} onAddIngredient={onAddIngredient} showContent />
          )}

          {/* Content Angles from Google Trends */}
          {ingredients.length >= 1 && (
            <ContentAngles ingredients={ingredients} />
          )}

          {/* Ingredient Search Trends */}
          {ingredients.length >= 1 && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Search Trends</h3>
                  <p className="text-sm text-gray-500">Internal search activity over time</p>
                </div>
              </div>
              <div className="space-y-3">
                {ingredients.map((ingredient) => (
                  <div key={ingredient} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900 capitalize">{ingredient}</span>
                    <IngredientTrendSparkline ingredient={ingredient} period="weekly" showLabel />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Opportunities Section — filter out contradictory breakouts with no actual growth */}
          {opportunities.filter(opp =>
            !(opp.type === 'google_breakout' && opp.description?.includes('+0%'))
          ).length > 0 && (
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
                {opportunities
                  .filter(opp => !(opp.type === 'google_breakout' && opp.description?.includes('+0%')))
                  .map((opp, index) => (
                    <OpportunityCard key={index} opportunity={opp} ingredients={ingredients} />
                  ))}
              </div>
            </section>
          )}
        </>
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
            {(isLoggedIn ? youtubeVideos : youtubeVideos.slice(0, 3)).map((video) => (
              <YouTubeVideoCard key={video.youtubeId} video={video} />
            ))}
          </div>
          {!isLoggedIn && youtubeVideos.length > 3 && (
            <VideoSignInPrompt hiddenCount={youtubeVideos.length - 3} />
          )}
        </section>
      )}

      {/* Analyzed Videos */}
      {analyzedVideos.length > 0 && (
        <AnalyzedVideosSection
          videos={isLoggedIn ? analyzedVideos : analyzedVideos.slice(0, 3)}
          showSignIn={!isLoggedIn && analyzedVideos.length > 3}
          hiddenCount={analyzedVideos.length - 3}
        />
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
  showDetails,
}: {
  demand: DemandBand
  demandSignal?: DemandSignal
  rateLimitRemaining?: number
  showDetails: boolean
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
        {/* Demand Badge - Always visible */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${config.bgColor}`}>
          <span className="text-lg">{config.icon}</span>
          <span className={`font-bold ${config.color}`}>{config.label}</span>
          {showDetails && demandSignal && (
            <span className={`text-sm ${config.color} opacity-75`}>{demandSignal.demandScore}/100</span>
          )}
        </div>

        {/* Metrics - Only shown when logged in */}
        {showDetails && (
          <>
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
          </>
        )}

        {/* Rate Limit Warning */}
        {rateLimitRemaining !== undefined && rateLimitRemaining < 5 && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
            {rateLimitRemaining} searches left
          </span>
        )}
      </div>

      {/* Content Gap Analysis + Contextual Interpretation - Only shown when logged in */}
      {showDetails && demandSignal && demandSignal.contentGap && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
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
          <p className="text-sm text-gray-500">{demandSignal.contentGap.reasoning}</p>
          {/* Contextual interpretation of raw numbers */}
          {demandSignal.avgViews > 0 && (
            <p className="text-xs text-gray-400">
              {demandSignal.avgViews >= 1000000
                ? 'Very competitive — top videos get millions of views, typically requires an established channel'
                : demandSignal.avgViews >= 100000
                ? 'Competitive niche — strong view counts, but room for quality content'
                : demandSignal.avgViews >= 10000
                ? 'Accessible niche — solid views achievable for growing channels'
                : 'Small niche — lower view counts, but less competition'}
            </p>
          )}
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
          className="w-full h-44 object-cover group-hover:scale-105 group-active:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />
        <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
          {(video.relevanceScore * 100).toFixed(0)}% match
        </div>
      </a>
      <div className="p-4">
        <a
          href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block group-hover:text-[#10B981] group-active:text-[#10B981] transition-colors"
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
          <div className={`mt-3 text-xs p-2 rounded-lg flex items-center justify-between gap-2 ${
            correctionFeedback.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
          }`}>
            <span>{correctionFeedback}</span>
            <button
              onClick={() => setCorrectionFeedback(null)}
              className="p-0.5 hover:bg-black/10 rounded transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
          className="w-full h-44 object-cover group-hover:scale-105 group-active:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />
      </a>
      <div className="p-4">
        <a
          href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block group-hover:text-[#10B981] group-active:text-[#10B981] transition-colors"
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

type SortOption = 'relevance' | 'views' | 'newest'

function VideoSignInPrompt({ hiddenCount }: { hiddenCount: number }) {
  return (
    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
      <p className="text-sm text-gray-600 mb-2">
        +{hiddenCount} more {hiddenCount === 1 ? 'video' : 'videos'} available
      </p>
      <Link
        href="/auth/signin"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#10B981] hover:bg-[#059669] rounded-lg transition-colors"
      >
        Sign in to see all results
      </Link>
    </div>
  )
}

function AnalyzedVideosSection({
  videos,
  showSignIn,
  hiddenCount,
}: {
  videos: VideoResult[]
  showSignIn?: boolean
  hiddenCount?: number
}) {
  const [sortBy, setSortBy] = useState<SortOption>('relevance')

  const sortedVideos = [...videos].sort((a, b) => {
    if (sortBy === 'views') {
      return (b.views ?? 0) - (a.views ?? 0)
    }
    if (sortBy === 'newest') {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    }
    // 'relevance' — keep original order (already sorted by backend)
    return 0
  })

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'views', label: 'Most viewed' },
    { value: 'newest', label: 'Newest' },
  ]

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
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
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                sortBy === opt.value
                  ? 'bg-white text-gray-900 shadow-sm font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
      {showSignIn && hiddenCount && hiddenCount > 0 && (
        <VideoSignInPrompt hiddenCount={hiddenCount} />
      )}
    </section>
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
        <div className={`mt-3 text-xs p-2 rounded-lg flex items-center justify-between gap-2 ${
          trackFeedback.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
        }`}>
          <span>{trackFeedback}</span>
          <button
            onClick={() => setTrackFeedback(null)}
            className="p-0.5 hover:bg-black/10 rounded transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
