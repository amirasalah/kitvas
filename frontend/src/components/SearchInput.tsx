'use client'

import { useState, KeyboardEvent } from 'react'

interface SearchInputProps {
  ingredients: string[]
  onIngredientsChange: (ingredients: string[]) => void
  tags: string[]
  onTagsChange: (tags: string[]) => void
}

export function SearchInput({
  ingredients,
  onIngredientsChange,
  tags,
  onTagsChange,
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      addIngredients(inputValue)
    }
    if (e.key === ' ' && inputValue.trim() && !inputValue.endsWith(',') && !inputValue.endsWith(', ')) {
      e.preventDefault()
      setInputValue(inputValue.trim() + ', ')
    }
  }

  const clearAllIngredients = () => {
    onIngredientsChange([])
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
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={ingredients.length === 0 ? "Search by ingredients (e.g., chicken, garlic, lemon)" : "Add more..."}
                className="flex-1 min-w-[200px] px-2 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
              />
            )}

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
          </div>
        </div>

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
            Press space to separate ingredients, enter to search
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
