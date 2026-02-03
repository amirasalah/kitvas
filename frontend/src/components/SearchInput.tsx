'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { trpc } from '@/app/providers'

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

interface SearchInputProps {
  ingredients: string[]
  onIngredientsChange: (ingredients: string[]) => void
  tags: string[]
  onTagsChange: (tags: string[]) => void
  onSearch: () => void
  onClear?: () => void
  recentSearches?: string[][]
  onSelectRecentSearch?: (ingredients: string[]) => void
}

export function SearchInput({
  ingredients,
  onIngredientsChange,
  tags,
  onTagsChange,
  onSearch,
  onClear,
  recentSearches = [],
  onSelectRecentSearch,
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Get the current word being typed (after the last comma)
  const currentWord = inputValue.split(',').pop()?.trim() || ''
  const debouncedQuery = useDebounce(currentWord, 200)

  // Autocomplete query
  const { data: suggestions = [] } = trpc.search.autocomplete.useQuery(
    { query: debouncedQuery },
    {
      enabled: debouncedQuery.length >= 1,
      staleTime: 60000, // Cache for 1 minute
    }
  )

  // Trending ingredients query (for dropdown when empty)
  const { data: trendingData } = trpc.analytics.hotIngredients.useQuery(
    { period: 'today', limit: 6 },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )

  // Filter out already selected ingredients
  const filteredSuggestions = suggestions.filter(
    (s) => !ingredients.includes(s)
  )

  // Filter trending ingredients (exclude already selected)
  const trendingIngredients = (trendingData?.ingredients || []).filter(
    (t) => !ingredients.includes(t.name)
  )

  // Show/hide suggestions based on input and results (or recent searches when empty)
  useEffect(() => {
    const hasContent = filteredSuggestions.length > 0 && currentWord.length > 0
    // Don't auto-show on mount, only update when typing
    if (currentWord.length > 0) {
      setShowSuggestions(hasContent)
    }
    setHighlightedIndex(-1)
  }, [filteredSuggestions.length, currentWord])

  // Calculate total items for keyboard navigation
  const trendingCount = currentWord.length === 0 ? trendingIngredients.length : 0
  const recentCount = currentWord.length === 0 ? recentSearches.length : 0
  const totalDropdownItems = recentCount + trendingCount + filteredSuggestions.length

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectSuggestion = (suggestion: string) => {
    // Replace the current word with the selected suggestion
    const parts = inputValue.split(',')
    parts.pop() // Remove the partial word
    const prefix = parts.length > 0 ? parts.join(',') + ', ' : ''

    // Add the ingredient directly
    addIngredients(prefix + suggestion)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Handle suggestion/recent search navigation
    if (showSuggestions && totalDropdownItems > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((i) => Math.min(i + 1, totalDropdownItems - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault()
        // Check if selecting a recent search, trending, or suggestion
        if (highlightedIndex < recentCount) {
          // Selecting a recent search
          onSelectRecentSearch?.(recentSearches[highlightedIndex])
          setShowSuggestions(false)
        } else if (highlightedIndex < recentCount + trendingCount) {
          // Selecting a trending ingredient
          const trendingIndex = highlightedIndex - recentCount
          addIngredients(trendingIngredients[trendingIndex].name)
          setShowSuggestions(false)
        } else {
          // Selecting a suggestion
          selectSuggestion(filteredSuggestions[highlightedIndex - recentCount - trendingCount])
        }
        return
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        return
      }
      if (e.key === 'Tab' && highlightedIndex >= 0) {
        e.preventDefault()
        if (highlightedIndex < recentCount) {
          onSelectRecentSearch?.(recentSearches[highlightedIndex])
          setShowSuggestions(false)
        } else if (highlightedIndex < recentCount + trendingCount) {
          const trendingIndex = highlightedIndex - recentCount
          addIngredients(trendingIngredients[trendingIndex].name)
          setShowSuggestions(false)
        } else {
          selectSuggestion(filteredSuggestions[highlightedIndex - recentCount - trendingCount])
        }
        return
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (inputValue.trim()) {
        addIngredients(inputValue)
      } else if (ingredients.length > 0) {
        // Trigger search when Enter is pressed with empty input
        onSearch()
        setShowSuggestions(false)
      }
    }
    if (e.key === ' ' && inputValue.trim() && !inputValue.endsWith(',') && !inputValue.endsWith(', ')) {
      e.preventDefault()
      setInputValue(inputValue.trim() + ', ')
    }
  }

  const clearAllIngredients = () => {
    onIngredientsChange([])
    onTagsChange([])
    setInputValue('')
    setShowFilters(false)
    onClear?.()
  }

  const addIngredients = (input: string) => {
    const newIngredients = input
      .split(',')
      .map((ing) => ing.trim().toLowerCase())
      .filter((ing) => ing && !ingredients.includes(ing))

    const available = 10 - ingredients.length
    const toAdd = newIngredients.slice(0, available)

    if (toAdd.length > 0) {
      onIngredientsChange([...ingredients, ...toAdd])
    }
    setInputValue('')
  }

  const removeIngredient = (index: number) => {
    onIngredientsChange(ingredients.filter((_, i) => i !== index))
  }

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      onTagsChange(tags.filter((t) => t !== tag))
    } else {
      onTagsChange([...tags, tag])
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Search Input */}
      <div className="relative">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Icon */}
            <div className="pl-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Ingredient Chips */}
            {ingredients.map((ingredient, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ECFDF5] text-[#10B981] rounded-lg text-sm font-medium border border-[#10B981]/20"
              >
                {ingredient}
                <button
                  onClick={() => removeIngredient(index)}
                  className="ml-0.5 text-[#10B981]/60 hover:text-[#10B981] transition-colors"
                  aria-label={`Remove ${ingredient}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}

            {/* Input Field */}
            {ingredients.length < 10 && (
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  // Show dropdown if there are suggestions, recent searches, or trending available
                  if ((filteredSuggestions.length > 0 && currentWord.length > 0) ||
                      ((recentSearches.length > 0 || trendingIngredients.length > 0) && currentWord.length === 0)) {
                    setShowSuggestions(true)
                  }
                }}
                placeholder={ingredients.length === 0 ? "Search by ingredients (e.g., chicken, garlic, lemon)" : "Add more..."}
                className="flex-1 min-w-[200px] px-2 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
                autoComplete="off"
              />
            )}

            {/* Action Buttons - grouped together to prevent wrapping */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
              {/* Clear All Button */}
              {ingredients.length > 0 && (
                <button
                  onClick={clearAllIngredients}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}

              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-xl transition-all ${
                  showFilters || tags.length > 0
                    ? 'bg-[#10B981] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>

              {/* Search Button */}
              {ingredients.length > 0 && (
                <button
                  onClick={() => {
                    onSearch()
                    setShowSuggestions(false)
                  }}
                  className="px-4 py-2.5 bg-[#10B981] text-white rounded-xl font-medium hover:bg-[#059669] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Autocomplete Dropdown */}
        {showSuggestions && (filteredSuggestions.length > 0 || ((recentSearches.length > 0 || trendingIngredients.length > 0) && currentWord.length === 0)) && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto"
          >
            {/* Recent Searches - show when input is empty */}
            {currentWord.length === 0 && recentSearches.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
                  Recent Searches
                </div>
                {recentSearches.map((recent, index) => (
                  <button
                    key={`recent-${index}`}
                    type="button"
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                      index === highlightedIndex
                        ? 'bg-[#10B981]/10 text-[#10B981]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => onSelectRecentSearch?.(recent)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="flex gap-1.5">
                        {recent.map((ing, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                            {ing}
                          </span>
                        ))}
                      </span>
                    </span>
                  </button>
                ))}
              </>
            )}
            {/* Trending Ingredients - show when input is empty */}
            {currentWord.length === 0 && trendingIngredients.length > 0 && (
              <>
                <div className={`px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100 ${recentSearches.length > 0 ? 'border-t' : ''}`}>
                  <span className="flex items-center gap-1.5">
                    <span>🔥</span> Trending Today
                  </span>
                </div>
                {trendingIngredients.map((trending, index) => {
                  const adjustedIndex = recentCount + index
                  return (
                    <button
                      key={`trending-${trending.name}`}
                      type="button"
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        adjustedIndex === highlightedIndex
                          ? 'bg-[#10B981]/10 text-[#10B981]'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        addIngredients(trending.name)
                        setShowSuggestions(false)
                      }}
                      onMouseEnter={() => setHighlightedIndex(adjustedIndex)}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 flex items-center justify-center text-xs text-orange-500 font-bold">
                          {index + 1}
                        </span>
                        <span className="capitalize">{trending.name}</span>
                        {trending.isBreakout && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded">
                            BREAKOUT
                          </span>
                        )}
                        {trending.growth > 10 && !trending.isBreakout && (
                          <span className="text-xs text-green-600">↑{trending.growth}%</span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </>
            )}
            {/* Ingredient Suggestions */}
            {filteredSuggestions.length > 0 && currentWord.length > 0 && (
              <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
                Suggestions
              </div>
            )}
            {filteredSuggestions.map((suggestion, index) => {
              const adjustedIndex = currentWord.length === 0 ? index + recentCount + trendingCount : index
              return (
                <button
                  key={suggestion}
                  type="button"
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    adjustedIndex === highlightedIndex
                      ? 'bg-[#10B981]/10 text-[#10B981]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => selectSuggestion(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(adjustedIndex)}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    {suggestion}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Active Tag Pills */}
        {tags.length > 0 && !showFilters && (
          <div className="flex items-center gap-2 mt-3 px-2">
            <span className="text-xs text-gray-500">Filters:</span>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {tag}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Hint Text */}
        {ingredients.length === 0 && (
          <p className="text-xs text-gray-400 mt-2 px-2">
            Press space to separate ingredients, click Search or press Enter when done
          </p>
        )}
        {ingredients.length >= 10 && (
          <p className="text-xs text-amber-600 mt-2 px-2">
            Maximum 10 ingredients reached
          </p>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {tags.length > 0 && (
              <button
                onClick={() => onTagsChange([])}
                className="text-sm text-[#10B981] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="space-y-5">
            {/* Cooking Methods */}
            <FilterGroup
              label="Cooking Method"
              icon="🍳"
              options={['air fryer', 'oven', 'stovetop', 'grill', 'instant pot', 'slow cooker', 'no cook']}
              selected={tags}
              onToggle={toggleTag}
              color="purple"
            />

            {/* Dietary */}
            <FilterGroup
              label="Dietary"
              icon="🥗"
              options={['vegan', 'vegetarian', 'gluten-free', 'keto', 'dairy-free', 'low calorie']}
              selected={tags}
              onToggle={toggleTag}
              color="green"
            />

            {/* Cuisine */}
            <FilterGroup
              label="Cuisine"
              icon="🌍"
              options={['korean', 'japanese', 'italian', 'mexican', 'indian', 'thai', 'chinese', 'mediterranean']}
              selected={tags}
              onToggle={toggleTag}
              color="orange"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function FilterGroup({
  label,
  icon,
  options,
  selected,
  onToggle,
  color,
}: {
  label: string
  icon: string
  options: string[]
  selected: string[]
  onToggle: (tag: string) => void
  color: 'purple' | 'green' | 'orange'
}) {
  const colors = {
    purple: {
      active: 'bg-purple-600 text-white border-purple-600',
      inactive: 'bg-white text-purple-700 border-purple-200 hover:border-purple-400 hover:bg-purple-50',
    },
    green: {
      active: 'bg-emerald-600 text-white border-emerald-600',
      inactive: 'bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50',
    },
    orange: {
      active: 'bg-orange-500 text-white border-orange-500',
      inactive: 'bg-white text-orange-700 border-orange-200 hover:border-orange-400 hover:bg-orange-50',
    },
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <span>{icon}</span>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt)
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${
                isSelected ? colors[color].active : colors[color].inactive
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
