'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/app/providers'
import { EmptyStateIllustration } from './FoodIllustrations'

type OpportunityStatus = 'researching' | 'filming' | 'published' | 'abandoned'

export function MyOpportunitiesPage() {
  const opportunitiesQuery = trpc.opportunities.list.useQuery()
  const pendingOutcomesQuery = trpc.opportunities.getPendingOutcomes.useQuery()

  const updateStatusMutation = trpc.opportunities.updateStatus.useMutation({
    onSuccess: () => {
      opportunitiesQuery.refetch()
    },
  })

  const deleteMutation = trpc.opportunities.delete.useMutation({
    onSuccess: () => {
      opportunitiesQuery.refetch()
    },
  })

  if (opportunitiesQuery.isLoading) {
    return (
      <div className="min-h-screen">
        <div className="gradient-hero py-12">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#10B981] animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Loading your opportunities...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (opportunitiesQuery.error) {
    return (
      <div className="min-h-screen">
        <div className="gradient-hero py-12">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium mb-2">Unable to load opportunities</p>
              <p className="text-gray-500 text-sm mb-4">Please try again later</p>
              <button
                onClick={() => opportunitiesQuery.refetch()}
                className="btn-primary text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { opportunities, activeCount, limit, isAtLimit } = opportunitiesQuery.data || {
    opportunities: [],
    activeCount: 0,
    limit: 5,
    isAtLimit: false,
  }

  const active = opportunities.filter(
    (o) => o.status === 'researching' || o.status === 'filming'
  )
  const completed = opportunities.filter(
    (o) => o.status === 'published' || o.status === 'abandoned'
  )

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <section className="gradient-hero py-12">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-full text-sm font-medium text-[#10B981] mb-4 shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Track Your Ideas
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                My Opportunities
              </h1>
              <p className="text-gray-600">
                Track your recipe ideas from research to published
              </p>
            </div>
            <Link
              href="/"
              className="btn-secondary text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Back to Search
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
        {/* Limit indicator */}
        {limit && (
          <div
            className={`mb-6 p-4 rounded-2xl border ${
              isAtLimit
                ? 'bg-amber-50 border-amber-200'
                : 'bg-white border-gray-100 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAtLimit ? 'bg-amber-100' : 'bg-[#ECFDF5]'}`}>
                  <svg className={`w-5 h-5 ${isAtLimit ? 'text-amber-600' : 'text-[#10B981]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Active Opportunities</p>
                  <p className="text-sm text-gray-500">
                    {activeCount} of {limit} slots used
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isAtLimit ? 'bg-amber-500' : 'bg-[#10B981]'}`}
                    style={{ width: `${(activeCount / limit) * 100}%` }}
                  />
                </div>
                {isAtLimit && (
                  <span className="text-xs text-amber-700 font-medium">
                    Limit reached
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pending outcomes alert */}
        {pendingOutcomesQuery.data && pendingOutcomesQuery.data.count > 0 && (
          <div className="mb-6 p-4 bg-[#ECFDF5] border border-[#10B981]/20 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#10B981] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  You have {pendingOutcomesQuery.data.count} opportunit
                  {pendingOutcomesQuery.data.count === 1 ? 'y' : 'ies'} ready for outcome reporting!
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Report how your videos performed to help calibrate recommendations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active opportunities */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Active</h2>
            <span className="px-2.5 py-1 text-sm font-medium bg-[#ECFDF5] text-[#10B981] rounded-lg">
              {active.length}
            </span>
          </div>
          {active.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="flex justify-center mb-4">
                <EmptyStateIllustration type="opportunities" />
              </div>
              <p className="text-gray-600 mb-4">
                No active opportunities yet.
              </p>
              <Link href="/" className="btn-primary text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search for Opportunities
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onUpdateStatus={(status) =>
                    updateStatusMutation.mutate({
                      opportunityId: opp.id,
                      status,
                    })
                  }
                  onDelete={() =>
                    deleteMutation.mutate({ opportunityId: opp.id })
                  }
                  isUpdating={updateStatusMutation.isPending}
                />
              ))}
            </div>
          )}
        </section>

        {/* Completed opportunities */}
        {completed.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-900">Completed</h2>
              <span className="px-2.5 py-1 text-sm font-medium bg-gray-100 text-gray-600 rounded-lg">
                {completed.length}
              </span>
            </div>
            <div className="space-y-3">
              {completed.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onUpdateStatus={(status) =>
                    updateStatusMutation.mutate({
                      opportunityId: opp.id,
                      status,
                    })
                  }
                  onDelete={() =>
                    deleteMutation.mutate({ opportunityId: opp.id })
                  }
                  isUpdating={updateStatusMutation.isPending}
                  showOutcomeButton={
                    opp.status === 'published' && !opp.hasOutcome
                  }
                />
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  )
}

function OpportunityCard({
  opportunity,
  onUpdateStatus,
  onDelete,
  isUpdating,
  showOutcomeButton = false,
}: {
  opportunity: {
    id: string
    ingredients: string[]
    status: string
    opportunityScore: string
    trackedAt: Date | string
    hasOutcome: boolean
  }
  onUpdateStatus: (status: OpportunityStatus) => void
  onDelete: () => void
  isUpdating: boolean
  showOutcomeButton?: boolean
}) {
  const [showOutcomeForm, setShowOutcomeForm] = useState(false)

  const scoreConfig = {
    high: {
      bg: 'bg-[#ECFDF5]',
      text: 'text-[#10B981]',
      border: 'border-[#10B981]/20',
      icon: '🔥',
    },
    medium: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: '⚡',
    },
    low: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-200',
      icon: '💡',
    },
  }

  const statusConfig = {
    researching: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      label: 'Researching',
    },
    filming: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      label: 'Filming',
    },
    published: {
      bg: 'bg-[#ECFDF5]',
      text: 'text-[#10B981]',
      label: 'Published',
    },
    abandoned: {
      bg: 'bg-gray-100',
      text: 'text-gray-500',
      label: 'Abandoned',
    },
  }

  const nextStatus: Record<string, OpportunityStatus | null> = {
    researching: 'filming',
    filming: 'published',
    published: null,
    abandoned: null,
  }

  const score = scoreConfig[opportunity.opportunityScore as keyof typeof scoreConfig] || scoreConfig.low
  const status = statusConfig[opportunity.status as keyof typeof statusConfig] || statusConfig.researching

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:shadow-md transition-all duration-300">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Ingredients */}
            <div className="flex flex-wrap gap-2 mb-3">
              {opportunity.ingredients.map((ing, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-3 py-1.5 bg-[#ECFDF5] text-[#10B981] rounded-lg text-sm font-medium border border-[#10B981]/20"
                >
                  {ing}
                </span>
              ))}
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-3 text-sm">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${score.bg} ${score.text} ${score.border}`}
              >
                <span>{score.icon}</span>
                {opportunity.opportunityScore.charAt(0).toUpperCase() + opportunity.opportunityScore.slice(1)}
              </span>
              <span
                className={`px-2.5 py-1 rounded-lg ${status.bg} ${status.text}`}
              >
                {status.label}
              </span>
              <span className="text-gray-400">
                Tracked {formatDate(opportunity.trackedAt)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {nextStatus[opportunity.status] && (
              <button
                onClick={() => onUpdateStatus(nextStatus[opportunity.status]!)}
                disabled={isUpdating}
                className="btn-primary text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Mark as {nextStatus[opportunity.status]}
              </button>
            )}
            {showOutcomeButton && (
              <button
                onClick={() => setShowOutcomeForm(true)}
                className="btn-primary text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Report Outcome
              </button>
            )}
            {opportunity.hasOutcome && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#ECFDF5] text-[#10B981] rounded-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Outcome reported
              </span>
            )}
            <button
              onClick={onDelete}
              disabled={isUpdating}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 active:text-red-500 active:bg-red-50 rounded-lg transition-colors"
              title="Remove from tracking"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Outcome form */}
      {showOutcomeForm && (
        <OutcomeForm
          opportunityId={opportunity.id}
          onClose={() => setShowOutcomeForm(false)}
        />
      )}
    </div>
  )
}

function OutcomeForm({
  opportunityId,
  onClose,
}: {
  opportunityId: string
  onClose: () => void
}) {
  const [videoUrl, setVideoUrl] = useState('')
  const [views7day, setViews7day] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [didNotPublish, setDidNotPublish] = useState(false)

  const utils = trpc.useUtils()

  const submitMutation = trpc.outcomes.submit.useMutation({
    onSuccess: () => {
      utils.opportunities.list.invalidate()
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitMutation.mutate({
      trackedOpportunityId: opportunityId,
      videoUrl: videoUrl || undefined,
      views7day: views7day ? parseInt(views7day, 10) : undefined,
      rating: rating || undefined,
      didNotPublish,
    })
  }

  return (
    <div className="border-t border-gray-100 bg-gray-50 rounded-b-2xl p-5">
      <h4 className="font-semibold text-gray-900 mb-4">Report Outcome</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-[#10B981] transition-colors">
          <input
            type="checkbox"
            checked={didNotPublish}
            onChange={(e) => setDidNotPublish(e.target.checked)}
            className="w-4 h-4 text-[#10B981] border-gray-300 rounded focus:ring-[#10B981]"
          />
          <span className="text-sm text-gray-700">I decided not to publish this video</span>
        </label>

        {!didNotPublish && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                YouTube URL (optional)
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="input-modern"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First 7-day views (optional)
              </label>
              <input
                type="number"
                value={views7day}
                onChange={(e) => setViews7day(e.target.value)}
                placeholder="e.g., 5000"
                min="0"
                className="input-modern"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How would you rate this opportunity?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`w-12 h-12 rounded-xl font-semibold transition-all duration-200 ${
                      rating === n
                        ? 'bg-[#10B981] text-white shadow-md scale-105'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-[#10B981] hover:text-[#10B981]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                1 = Poor opportunity, 5 = Great opportunity
              </p>
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="btn-primary"
          >
            {submitMutation.isPending ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Submit Outcome
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>

        {submitMutation.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">
              Error: {submitMutation.error.message}
            </p>
          </div>
        )}
      </form>
    </div>
  )
}

function formatDate(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return d.toLocaleDateString()
}
