'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/app/providers'
import { SearchInput } from './SearchInput'
import { SearchResults } from './SearchResults'
import { HeroFoodDecorations } from './FoodIllustrations'
import { TrendingIngredients } from './TrendingIngredients'

const SEARCH_HISTORY_KEY = 'kitvas-search-history'
const MAX_HISTORY_ITEMS = 5

// Type for search history entries
type SearchHistoryEntry = {
  ingredients: string[]
  timestamp: number
}

export function SearchPage() {
  const [ingredients, setIngredients] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  // Separate state for committed search - only updates when user explicitly triggers search
  const [searchIngredients, setSearchIngredients] = useState<string[]>([])
  const [searchTags, setSearchTags] = useState<string[]>([])
  // Recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState<string[][]>([])

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
      if (stored) {
        const history: SearchHistoryEntry[] = JSON.parse(stored)
        // Extract just the ingredients arrays, most recent first
        setRecentSearches(history.map(h => h.ingredients))
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Save search to history
  const saveToHistory = (newIngredients: string[]) => {
    if (newIngredients.length === 0) return

    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
      let history: SearchHistoryEntry[] = stored ? JSON.parse(stored) : []

      // Remove duplicate if exists (same ingredients in same order)
      const key = newIngredients.join(',').toLowerCase()
      history = history.filter(h => h.ingredients.join(',').toLowerCase() !== key)

      // Add new entry at the beginning
      history.unshift({
        ingredients: newIngredients,
        timestamp: Date.now()
      })

      // Keep only the most recent entries
      history = history.slice(0, MAX_HISTORY_ITEMS)

      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history))
      setRecentSearches(history.map(h => h.ingredients))
    } catch {
      // Ignore localStorage errors
    }
  }

  const searchQuery = trpc.search.search.useQuery(
    {
      ingredients: searchIngredients,
      tags: searchTags.length > 0 ? searchTags : undefined,
    },
    {
      enabled: searchIngredients.length > 0,
      staleTime: 4 * 60 * 60 * 1000, // Cache for 4 hours
      gcTime: 4 * 60 * 60 * 1000, // Keep in cache for 4 hours
    }
  )

  const handleSearch = () => {
    if (ingredients.length >= 2) {
      setSearchIngredients([...ingredients])
      setSearchTags([...tags])
      saveToHistory([...ingredients])
    }
  }

  const hasSearched = searchIngredients.length > 0

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className={`gradient-hero transition-all duration-500 relative overflow-hidden ${hasSearched ? 'py-8' : 'py-16 lg:py-24'}`}>
        {/* Floating Food Illustrations */}
        {!hasSearched && <HeroFoodDecorations />}

        <div className="max-w-5xl mx-auto px-6 lg:px-8 relative z-10">
          {/* Hero Content */}
          <div className={`text-center transition-all duration-500 ${hasSearched ? 'mb-6' : 'mb-12'}`}>
            {!hasSearched && (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-full text-sm font-medium text-[#10B981] mb-6 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                  Intelligence for Food Creators
                </div>
                <h1 className="text-4xl lg:text-5xl bitcount-logo text-gray-900 mb-4 leading-tight">
                  Discover Recipe<br />
                  <span className="text-[#10B981]">Opportunities</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Search by ingredients to find content gaps, understand market demand,
                  and discover what your audience wants to see.
                </p>
              </>
            )}
          </div>

          {/* Search Input */}
          <div className={`transition-all duration-300 ${hasSearched ? '' : 'max-w-3xl mx-auto'}`}>
            <SearchInput
              ingredients={ingredients}
              onIngredientsChange={setIngredients}
              tags={tags}
              onTagsChange={setTags}
              onSearch={handleSearch}
              onClear={() => {
                setSearchIngredients([])
                setSearchTags([])
              }}
              recentSearches={hasSearched ? [] : recentSearches.slice(0, 2)}
              onSelectRecentSearch={(recent) => {
                setIngredients(recent)
                setSearchIngredients(recent)
                setSearchTags([])
              }}
            />
          </div>

          {/* Feature Pills - only show when no search */}
          {!hasSearched && (
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <FeaturePill icon="📊" text="Demand Signals" />
              <FeaturePill icon="🎯" text="Content Gaps" />
              <FeaturePill icon="✨" text="AI Detection" />
              <FeaturePill icon="📈" text="Trend Analysis" />
            </div>
          )}

          {/* Trending Ingredients - only show when no search */}
          {!hasSearched && (
            <div className="max-w-3xl mx-auto">
              <TrendingIngredients
                onIngredientClick={(ingredient) => {
                  setIngredients([ingredient])
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* Results Section - only show when searching or has results */}
      {hasSearched && (
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {searchQuery.isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#10B981] animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Analyzing ingredients...</p>
          </div>
        )}

        {searchQuery.error && (
          <div className="max-w-2xl mx-auto mt-8 p-6 bg-red-50 border border-red-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-red-800">Something went wrong</h3>
                <p className="text-red-700 mt-1">{searchQuery.error.message}</p>
              </div>
            </div>
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
            onAddIngredient={(ing) => {
                const newIngredients = [...ingredients, ing]
                setIngredients(newIngredients)
                setSearchIngredients(newIngredients)
              }}
          />
        )}
      </section>
      )}
    </div>
  )
}

function FeaturePill({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100">
      <span>{icon}</span>
      <span className="text-sm font-medium text-gray-700">{text}</span>
    </div>
  )
}
