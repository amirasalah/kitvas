'use client'

import { useState } from 'react'
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
          <h1 className="text-4xl font-bold mb-2">Kitvas</h1>
          <p className="text-gray-600">
            Intelligence platform for food content creators
          </p>
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
            videos={searchQuery.data.videos}
            demand={searchQuery.data.demand}
            opportunities={searchQuery.data.opportunities}
          />
        )}
      </div>
    </div>
  )
}
