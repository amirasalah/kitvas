'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/app/providers'

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
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-500">Loading your opportunities...</p>
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
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Opportunities</h1>
              <p className="text-gray-600">
                Track your recipe ideas from research to published
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Back to Search
            </Link>
          </div>
        </header>

        {/* Limit indicator for free users */}
        {limit && (
          <div
            className={`mb-6 p-3 rounded-lg ${
              isAtLimit ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
            }`}
          >
            <p className="text-sm">
              <span className="font-medium">Active opportunities:</span>{' '}
              {activeCount} / {limit}
              {isAtLimit && (
                <span className="text-yellow-700 ml-2">
                  (Limit reached. Complete or remove one to track more.)
                </span>
              )}
            </p>
          </div>
        )}

        {/* Pending outcomes alert */}
        {pendingOutcomesQuery.data && pendingOutcomesQuery.data.count > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="font-medium text-blue-800">
              You have {pendingOutcomesQuery.data.count} opportunit
              {pendingOutcomesQuery.data.count === 1 ? 'y' : 'ies'} ready for
              outcome reporting!
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Report how your videos performed to help calibrate recommendations.
            </p>
          </div>
        )}

        {/* Active opportunities */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Active ({active.length})
          </h2>
          {active.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No active opportunities. Search for ingredients to find and track
              opportunities.
            </p>
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
            <h2 className="text-xl font-semibold mb-4">
              Completed ({completed.length})
            </h2>
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
      </div>
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

  const scoreColors = {
    high: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-gray-100 text-gray-600 border-gray-200',
  }

  const statusColors = {
    researching: 'bg-blue-100 text-blue-800',
    filming: 'bg-purple-100 text-purple-800',
    published: 'bg-green-100 text-green-800',
    abandoned: 'bg-gray-100 text-gray-500',
  }

  const nextStatus: Record<string, OpportunityStatus | null> = {
    researching: 'filming',
    filming: 'published',
    published: null,
    abandoned: null,
  }

  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Ingredients */}
          <div className="flex flex-wrap gap-1 mb-2">
            {opportunity.ingredients.map((ing, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-gray-100 text-gray-700 text-sm rounded"
              >
                {ing}
              </span>
            ))}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`px-2 py-0.5 rounded border ${
                scoreColors[opportunity.opportunityScore as keyof typeof scoreColors] ||
                scoreColors.low
              }`}
            >
              {opportunity.opportunityScore.toUpperCase()}
            </span>
            <span
              className={`px-2 py-0.5 rounded ${
                statusColors[opportunity.status as keyof typeof statusColors] ||
                statusColors.researching
              }`}
            >
              {opportunity.status}
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
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Mark as {nextStatus[opportunity.status]}
            </button>
          )}
          {showOutcomeButton && (
            <button
              onClick={() => setShowOutcomeForm(true)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Report Outcome
            </button>
          )}
          {opportunity.hasOutcome && (
            <span className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded">
              Outcome reported
            </span>
          )}
          <button
            onClick={onDelete}
            disabled={isUpdating}
            className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
            title="Remove from tracking"
          >
            Remove
          </button>
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
    <div className="mt-4 p-4 border-t bg-gray-50 rounded-b-lg">
      <h4 className="font-medium mb-3">Report Outcome</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={didNotPublish}
              onChange={(e) => setDidNotPublish(e.target.checked)}
            />
            I decided not to publish this video
          </label>
        </div>

        {!didNotPublish && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">
                YouTube URL (optional)
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                First 7-day views (optional)
              </label>
              <input
                type="number"
                value={views7day}
                onChange={(e) => setViews7day(e.target.value)}
                placeholder="e.g., 5000"
                min="0"
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                How would you rate this opportunity?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`w-10 h-10 rounded ${
                      rating === n
                        ? 'bg-yellow-400 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                1 = Poor opportunity, 5 = Great opportunity
              </p>
            </div>
          </>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Outcome'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>

        {submitMutation.error && (
          <p className="text-sm text-red-600">
            Error: {submitMutation.error.message}
          </p>
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
