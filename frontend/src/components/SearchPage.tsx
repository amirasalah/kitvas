'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { trpc } from '@/app/providers'
import { SearchInput } from './SearchInput'
import { SearchResults } from './SearchResults'
import { HeroFoodDecorations } from './FoodIllustrations'
import { TrendingIngredients } from './TrendingIngredients'
import { LoginGate } from './LoginGate'

const SEARCH_HISTORY_KEY = 'kitvas-search-history'
const MAX_HISTORY_ITEMS = 5
const GUEST_SEARCH_LIMIT = 2
const SEARCH_COUNT_KEY = 'kitvas-guest-searches'

// Type for search history entries
type SearchHistoryEntry = {
  ingredients: string[]
  timestamp: number
}

export function SearchPage() {
  const { data: session } = useSession()
  const isLoggedIn = !!session
  const [ingredients, setIngredients] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  // Separate state for committed search - only updates when user explicitly triggers search
  const [searchIngredients, setSearchIngredients] = useState<string[]>([])
  const [searchTags, setSearchTags] = useState<string[]>([])
  // Recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState<string[][]>([])
  // Guest search limit
  const [guestSearchCount, setGuestSearchCount] = useState(0)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)

  // Load search history and guest search count on mount
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
    try {
      const count = sessionStorage.getItem(SEARCH_COUNT_KEY)
      if (count) setGuestSearchCount(parseInt(count, 10))
    } catch {
      // Ignore sessionStorage errors
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
      // Enforce search limit for non-logged-in users
      if (!isLoggedIn) {
        if (guestSearchCount >= GUEST_SEARCH_LIMIT) {
          setShowSignupPrompt(true)
          return
        }
        const newCount = guestSearchCount + 1
        setGuestSearchCount(newCount)
        try { sessionStorage.setItem(SEARCH_COUNT_KEY, String(newCount)) } catch {}
      }

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
              <LoginGate blur message="Sign in to see trending ingredients">
                <TrendingIngredients
                  onIngredientClick={(ingredient) => {
                    setIngredients([ingredient])
                  }}
                />
              </LoginGate>
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

      {/* Guest search limit signup prompt */}
      {showSignupPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              You've used your {GUEST_SEARCH_LIMIT} free searches
            </h2>
            <p className="text-gray-600 mb-6">
              Sign in to get unlimited searches, track opportunities, and access full trending data.
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-[#10B981] hover:bg-[#059669] rounded-xl transition-colors shadow-lg shadow-[#10B981]/25"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
              </svg>
              Sign in with Google
            </Link>
            <p className="text-xs text-gray-400 mt-4">
              {GUEST_SEARCH_LIMIT}/{GUEST_SEARCH_LIMIT} searches used this session
            </p>
          </div>
        </div>
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
