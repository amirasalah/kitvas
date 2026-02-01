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
    <div className="min-h-screen">
      {/* Hero Header */}
      <section className="gradient-hero py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-full text-sm font-medium text-[#10B981] mb-4 shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Admin Tools
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Training Data Labeling
              </h1>
              <p className="text-gray-600">
                Review and correct ingredient extraction for training data
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/label/export"
                className="btn-primary text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Export Dataset
              </Link>
              <Link
                href="/"
                className="btn-secondary text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        {statsQuery.data && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatCard
              label="Total Videos"
              value={statsQuery.data.totalVideos}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
            />
            <StatCard
              label="Labeled"
              value={statsQuery.data.labeledVideos}
              accent="green"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="Unlabeled"
              value={statsQuery.data.unlabeledVideos}
              accent="amber"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="Ingredients"
              value={statsQuery.data.totalIngredients}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              }
            />
            <StatCard
              label="Progress"
              value={`${(statsQuery.data.labelingProgress * 100).toFixed(1)}%`}
              accent={statsQuery.data.labelingProgress > 0.5 ? 'green' : 'amber'}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {(['unlabeled', 'labeled', 'all'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                    filter === f
                      ? 'bg-[#10B981] text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex-1 relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-md pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Main Content: Video List + Editor */}
        <div className="flex gap-6">
          {/* Video List */}
          <div className={`${selectedVideoId ? 'w-1/3' : 'w-full'} space-y-3 transition-all duration-300`}>
            {videosQuery.isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#10B981] animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Loading videos...</p>
              </div>
            )}

            {videosQuery.data?.videos.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600">No videos found.</p>
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
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string
  value: number | string
  accent?: 'green' | 'amber' | 'red'
  icon: React.ReactNode
}) {
  const accentConfig = {
    green: {
      border: 'border-l-[#10B981]',
      bg: 'bg-[#ECFDF5]',
      iconBg: 'bg-[#10B981]',
      iconText: 'text-white',
    },
    amber: {
      border: 'border-l-amber-500',
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-600',
    },
    red: {
      border: 'border-l-red-500',
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
    },
  }

  const config = accent ? accentConfig[accent] : {
    border: 'border-l-gray-300',
    bg: 'bg-white',
    iconBg: 'bg-gray-100',
    iconText: 'text-gray-600',
  }

  return (
    <div
      className={`p-4 rounded-2xl border-l-4 ${config.border} ${config.bg} border border-gray-100 shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${config.iconBg} ${config.iconText} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
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
      className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
        isSelected
          ? 'border-[#10B981] bg-[#ECFDF5] shadow-md'
          : 'border-gray-100 hover:border-[#10B981]/50 bg-white shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex gap-4">
        <img
          src={video.thumbnailUrl}
          alt=""
          className="w-28 h-20 object-cover rounded-xl flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">{video.title}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              {video.ingredients.length}
            </span>
            {video.correctionsCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {video.correctionsCount}
              </span>
            )}
            {video.labeledAt && (
              <span className="inline-flex items-center gap-1 text-xs text-[#10B981] bg-[#ECFDF5] px-2 py-1 rounded-lg">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#10B981] animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading video details...</p>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600">Video not found.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-4">
      {/* Video Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg text-gray-900 line-clamp-2">{video.title}</h2>
            <a
              href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[#10B981] hover:underline mt-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Watch on YouTube
            </a>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Thumbnail */}
      <div className="px-5 pt-5">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-48 object-cover rounded-xl"
        />
      </div>

      {/* Description */}
      {video.description && (
        <div className="px-5 pt-4">
          <p className="text-sm text-gray-600 line-clamp-3 bg-gray-50 p-3 rounded-xl">
            {video.description}
          </p>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="mx-5 mt-4 text-sm p-3 bg-[#ECFDF5] text-[#10B981] rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {feedback}
        </div>
      )}

      {/* Ingredients Editor */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Ingredients ({video.ingredients.length})
          </h3>
          {video.labeledAt ? (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-[#ECFDF5] text-[#10B981] rounded-lg font-medium">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Labeled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg font-medium">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Unlabeled
            </span>
          )}
        </div>

        {/* Ingredient List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {video.ingredients.map((ing) => (
            <div
              key={ing.id}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors"
            >
              {renamingId === ing.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleRename(ing.id)
                  }}
                  className="flex-1 flex gap-2"
                >
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="text-xs px-3 py-1.5 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingId(null)
                      setRenameValue('')
                    }}
                    className="text-xs px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-gray-900">{ing.name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-lg ${
                      ing.confidence >= 0.8
                        ? 'bg-[#ECFDF5] text-[#10B981]'
                        : ing.confidence >= 0.5
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {(ing.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-lg">{ing.source}</span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={() => {
                        setRenamingId(ing.id)
                        setRenameValue(ing.name)
                      }}
                      className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                      title="Rename"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleRemove(ing.id)}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
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
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
          />
          <button
            type="submit"
            disabled={!newIngredient.trim() || addIngredientMutation.isPending}
            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        </form>
      </div>

      {/* Recent Corrections */}
      {video.recentCorrections.length > 0 && (
        <div className="px-5 pb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Recent Corrections
          </h4>
          <div className="space-y-1.5">
            {video.recentCorrections.map((c) => (
              <div key={c.id} className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                <span className="font-medium text-gray-900">{c.action}</span>:{' '}
                {c.ingredientName}
                {c.suggestedName && (
                  <span className="text-[#10B981]"> → {c.suggestedName}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-5 border-t border-gray-100 flex gap-3">
        {video.labeledAt ? (
          <button
            onClick={() => unmarkLabeledMutation.mutate({ videoId })}
            disabled={unmarkLabeledMutation.isPending}
            className="flex-1 btn-secondary disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Unmark as Labeled
          </button>
        ) : (
          <button
            onClick={() => markLabeledMutation.mutate({ videoId })}
            disabled={markLabeledMutation.isPending}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Mark as Labeled
          </button>
        )}
      </div>
    </div>
  )
}
