'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/app/providers'

type FilterType = 'all' | 'labeled' | 'unlabeled'

export function AdminLabelingPage() {
  const [filter, setFilter] = useState<FilterType>('unlabeled')
  const [search, setSearch] = useState('')
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)

  const statsQuery = trpc.admin.getStats.useQuery()
  const videosQuery = trpc.admin.getVideos.useQuery({
    filter,
    search: search || undefined,
    limit: 20,
  })

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Training Data Labeling</h1>
              <p className="text-gray-600 mt-1">
                Review and correct ingredient extraction for training data
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/label/export"
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Export Dataset
              </Link>
              <Link
                href="/"
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Back to Search
              </Link>
            </div>
          </div>
        </header>

        {/* Stats Bar */}
        {statsQuery.data && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatCard
              label="Total Videos"
              value={statsQuery.data.totalVideos}
            />
            <StatCard
              label="Labeled"
              value={statsQuery.data.labeledVideos}
              accent="green"
            />
            <StatCard
              label="Unlabeled"
              value={statsQuery.data.unlabeledVideos}
              accent="yellow"
            />
            <StatCard
              label="Ingredients"
              value={statsQuery.data.totalIngredients}
            />
            <StatCard
              label="Progress"
              value={`${(statsQuery.data.labelingProgress * 100).toFixed(1)}%`}
              accent={statsQuery.data.labelingProgress > 0.5 ? 'green' : 'yellow'}
            />
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {(['unlabeled', 'labeled', 'all'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm capitalize ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Main Content: Video List + Editor */}
        <div className="flex gap-6">
          {/* Video List */}
          <div className={`${selectedVideoId ? 'w-1/3' : 'w-full'} space-y-3`}>
            {videosQuery.isLoading && (
              <div className="text-center py-8 text-gray-500">
                Loading videos...
              </div>
            )}

            {videosQuery.data?.videos.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No videos found.
              </div>
            )}

            {videosQuery.data?.videos.map((video) => (
              <VideoListItem
                key={video.id}
                video={video}
                isSelected={selectedVideoId === video.id}
                onClick={() => setSelectedVideoId(video.id)}
              />
            ))}
          </div>

          {/* Editor Panel */}
          {selectedVideoId && (
            <div className="w-2/3">
              <VideoEditor
                videoId={selectedVideoId}
                onClose={() => setSelectedVideoId(null)}
                onLabeled={() => {
                  videosQuery.refetch()
                  statsQuery.refetch()
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number | string
  accent?: 'green' | 'yellow' | 'red'
}) {
  const accentColors = {
    green: 'border-green-500 bg-green-50',
    yellow: 'border-yellow-500 bg-yellow-50',
    red: 'border-red-500 bg-red-50',
  }

  return (
    <div
      className={`p-4 rounded-lg border-l-4 ${
        accent ? accentColors[accent] : 'border-gray-300 bg-gray-50'
      }`}
    >
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function VideoListItem({
  video,
  isSelected,
  onClick,
}: {
  video: {
    id: string
    youtubeId: string
    title: string
    thumbnailUrl: string
    labeledAt: string | null
    ingredients: Array<{ name: string }>
    correctionsCount: number
  }
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-400 bg-white'
      }`}
    >
      <div className="flex gap-3">
        <img
          src={video.thumbnailUrl}
          alt=""
          className="w-24 h-16 object-cover rounded flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium line-clamp-2">{video.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">
              {video.ingredients.length} ingredients
            </span>
            {video.correctionsCount > 0 && (
              <span className="text-xs text-orange-600">
                {video.correctionsCount} corrections
              </span>
            )}
            {video.labeledAt && (
              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                Labeled
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

function VideoEditor({
  videoId,
  onClose,
  onLabeled,
}: {
  videoId: string
  onClose: () => void
  onLabeled: () => void
}) {
  const [newIngredient, setNewIngredient] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const videoQuery = trpc.admin.getVideo.useQuery({ videoId })

  const markLabeledMutation = trpc.admin.markLabeled.useMutation({
    onSuccess: () => {
      videoQuery.refetch()
      onLabeled()
      showFeedback('Video marked as labeled')
    },
  })

  const unmarkLabeledMutation = trpc.admin.unmarkLabeled.useMutation({
    onSuccess: () => {
      videoQuery.refetch()
      onLabeled()
      showFeedback('Label removed')
    },
  })

  const addIngredientMutation = trpc.admin.addIngredient.useMutation({
    onSuccess: (data) => {
      videoQuery.refetch()
      onLabeled()
      setNewIngredient('')
      showFeedback(data.message)
    },
  })

  const removeIngredientMutation = trpc.admin.removeIngredient.useMutation({
    onSuccess: () => {
      videoQuery.refetch()
      onLabeled()
      showFeedback('Ingredient removed')
    },
  })

  const renameIngredientMutation = trpc.admin.renameIngredient.useMutation({
    onSuccess: (data) => {
      videoQuery.refetch()
      onLabeled()
      setRenamingId(null)
      setRenameValue('')
      showFeedback(data.message)
    },
  })

  const showFeedback = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 2500)
  }

  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newIngredient.trim()) return
    addIngredientMutation.mutate({
      videoId,
      ingredientName: newIngredient.trim(),
    })
  }

  const handleRemove = (ingredientId: string) => {
    removeIngredientMutation.mutate({ videoId, ingredientId })
  }

  const handleRename = (ingredientId: string) => {
    if (!renameValue.trim()) return
    renameIngredientMutation.mutate({
      videoId,
      ingredientId,
      newName: renameValue.trim(),
    })
  }

  const video = videoQuery.data

  if (videoQuery.isLoading) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-500">
        Loading video details...
      </div>
    )
  }

  if (!video) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-500">
        Video not found.
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white sticky top-4">
      {/* Video Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg line-clamp-2">{video.title}</h2>
            <a
              href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Watch on YouTube
            </a>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Thumbnail */}
      <div className="px-4 pt-4">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-48 object-cover rounded-lg"
        />
      </div>

      {/* Description */}
      {video.description && (
        <div className="px-4 pt-3">
          <p className="text-sm text-gray-600 line-clamp-4">
            {video.description}
          </p>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="mx-4 mt-3 text-xs p-2 bg-blue-50 text-blue-700 rounded">
          {feedback}
        </div>
      )}

      {/* Ingredients Editor */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm text-gray-700">
            Ingredients ({video.ingredients.length})
          </h3>
          {video.labeledAt ? (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
              Labeled
            </span>
          ) : (
            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
              Unlabeled
            </span>
          )}
        </div>

        {/* Ingredient List */}
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {video.ingredients.map((ing) => (
            <div
              key={ing.id}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded group"
            >
              {renamingId === ing.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleRename(ing.id)
                  }}
                  className="flex-1 flex gap-1"
                >
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingId(null)
                      setRenameValue('')
                    }}
                    className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <span className="flex-1 text-sm">{ing.name}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      ing.confidence >= 0.8
                        ? 'bg-green-100 text-green-700'
                        : ing.confidence >= 0.5
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {(ing.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-gray-400">{ing.source}</span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={() => {
                        setRenamingId(ing.id)
                        setRenameValue(ing.name)
                      }}
                      className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                      title="Rename"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleRemove(ing.id)}
                      className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      title="Remove"
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add Ingredient */}
        <form onSubmit={handleAddIngredient} className="flex gap-2">
          <input
            type="text"
            placeholder="Add ingredient..."
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newIngredient.trim() || addIngredientMutation.isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </form>
      </div>

      {/* Recent Corrections */}
      {video.recentCorrections.length > 0 && (
        <div className="px-4 pb-3">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
            Recent Corrections
          </h4>
          <div className="space-y-1">
            {video.recentCorrections.map((c) => (
              <div key={c.id} className="text-xs text-gray-600">
                <span className="font-medium">{c.action}</span>:{' '}
                {c.ingredientName}
                {c.suggestedName && ` -> ${c.suggestedName}`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-200 flex gap-3">
        {video.labeledAt ? (
          <button
            onClick={() => unmarkLabeledMutation.mutate({ videoId })}
            disabled={unmarkLabeledMutation.isPending}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Unmark as Labeled
          </button>
        ) : (
          <button
            onClick={() => markLabeledMutation.mutate({ videoId })}
            disabled={markLabeledMutation.isPending}
            className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Mark as Labeled
          </button>
        )}
      </div>
    </div>
  )
}
