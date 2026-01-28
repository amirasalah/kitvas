'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/app/providers'
import { SearchInput } from './SearchInput'
import { SearchResults } from './SearchResults'

export function SearchPage() {
  const [ingredients, setIngredients] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])

  const searchQuery = trpc.search.search.useQuery(
    {
      ingredients,
      tags: tags.length > 0 ? tags : undefined,
    },
    {
      enabled: ingredients.length > 0,
    }
  )

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Kitvas</h1>
              <p className="text-gray-600">
                Intelligence platform for food content creators
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/label"
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Admin Labeling
              </Link>
              <Link
                href="/opportunities"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                My Opportunities
              </Link>
            </div>
          </div>
        </header>

        <SearchInput
          ingredients={ingredients}
          onIngredientsChange={setIngredients}
          tags={tags}
          onTagsChange={setTags}
        />

        {searchQuery.isLoading && (
          <div className="mt-8 text-center text-gray-500">
            Searching...
          </div>
        )}

        {searchQuery.error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800">
              Error: {searchQuery.error.message}
            </p>
          </div>
        )}

        {searchQuery.data && (
          <SearchResults
            analyzedVideos={searchQuery.data.analyzedVideos}
            youtubeVideos={searchQuery.data.youtubeVideos}
            demand={searchQuery.data.demand}
            demandSignal={searchQuery.data.demandSignal}
            rateLimitRemaining={searchQuery.data.rateLimitRemaining}
            opportunities={searchQuery.data.opportunities}
            ingredients={ingredients}
            lowRelevanceFallback={searchQuery.data.lowRelevanceFallback}
          />
        )}
      </div>
    </div>
  )
}
