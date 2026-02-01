'use client'

import { useState } from 'react'
import { trpc } from '@/app/providers'
import { SearchInput } from './SearchInput'
import { SearchResults } from './SearchResults'
import { HeroFoodDecorations } from './FoodIllustrations'

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

  const hasSearched = ingredients.length > 0

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
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                  Discover Recipe<br />
                  <span className="text-[#10B981]">Opportunities</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Search by ingredients to find content gaps, understand market demand,
                  and discover what your audience wants to see.
                </p>
              </>
            )}
            {hasSearched && (
              <h1 className="text-2xl font-bold text-gray-900">
                Search Results
              </h1>
            )}
          </div>

          {/* Search Input */}
          <div className={`transition-all duration-300 ${hasSearched ? '' : 'max-w-3xl mx-auto'}`}>
            <SearchInput
              ingredients={ingredients}
              onIngredientsChange={setIngredients}
              tags={tags}
              onTagsChange={setTags}
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
        </div>
      </section>

      {/* Results Section */}
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
            lowRelevanceFallback={searchQuery.data.lowRelevanceFallback}
            onAddIngredient={(ing) => setIngredients([...ingredients, ing])}
          />
        )}
      </section>
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
