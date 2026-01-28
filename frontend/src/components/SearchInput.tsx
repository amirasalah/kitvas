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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      addIngredients(inputValue)
    }
    // Space key adds a comma to help user understand comma-separated format
    if (e.key === ' ' && inputValue.trim() && !inputValue.endsWith(',') && !inputValue.endsWith(', ')) {
      e.preventDefault()
      setInputValue(inputValue.trim() + ', ')
    }
  }

  const clearAllIngredients = () => {
    onIngredientsChange([])
  }

  const addIngredients = (input: string) => {
    // Split by comma and add each ingredient separately
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

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="ingredients" className="block text-sm font-medium mb-2">
          Search by Ingredients (comma-separated, up to 10)
        </label>
        <div className="flex gap-2 flex-wrap items-center">
          {ingredients.map((ingredient, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {ingredient}
              <button
                onClick={() => removeIngredient(index)}
                className="ml-1 text-blue-600 hover:text-blue-800"
                aria-label={`Remove ${ingredient}`}
              >
                ×
              </button>
            </span>
          ))}
          {ingredients.length > 0 && (
            <button
              onClick={clearAllIngredients}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              aria-label="Clear all ingredients"
            >
              Clear all
            </button>
          )}
          {ingredients.length < 10 && (
            <input
              id="ingredients"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type ingredients (space adds comma, enter to search)"
              className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            />
          )}
        </div>
        {ingredients.length >= 10 && (
          <p className="mt-1 text-sm text-gray-500">
            Maximum 10 ingredients reached
          </p>
        )}
      </div>

      {/* Tag Filters */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Filter by Tags</p>
        <div className="flex flex-wrap gap-2">
          {/* Cooking Methods */}
          <TagFilterGroup
            label="Cooking"
            options={['air fryer', 'oven', 'stovetop', 'grill', 'instant pot', 'slow cooker', 'no cook']}
            selected={tags}
            onToggle={(tag) => toggleTag(tag)}
            color="purple"
          />
          {/* Dietary */}
          <TagFilterGroup
            label="Dietary"
            options={['vegan', 'vegetarian', 'gluten-free', 'keto', 'dairy-free', 'low calorie']}
            selected={tags}
            onToggle={(tag) => toggleTag(tag)}
            color="green"
          />
          {/* Cuisine */}
          <TagFilterGroup
            label="Cuisine"
            options={['korean', 'japanese', 'italian', 'mexican', 'indian', 'thai', 'chinese', 'mediterranean']}
            selected={tags}
            onToggle={(tag) => toggleTag(tag)}
            color="orange"
          />
        </div>
        {tags.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Active filters:</span>
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full"
              >
                {tag}
                <button
                  onClick={() => toggleTag(tag)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={() => onTagsChange([])}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  )

  function toggleTag(tag: string) {
    if (tags.includes(tag)) {
      onTagsChange(tags.filter((t) => t !== tag))
    } else {
      onTagsChange([...tags, tag])
    }
  }
}

function TagFilterGroup({
  label,
  options,
  selected,
  onToggle,
  color,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (tag: string) => void
  color: 'purple' | 'green' | 'orange'
}) {
  const colors = {
    purple: {
      active: 'bg-purple-600 text-white',
      inactive: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    },
    green: {
      active: 'bg-green-600 text-white',
      inactive: 'bg-green-50 text-green-700 hover:bg-green-100',
    },
    orange: {
      active: 'bg-orange-600 text-white',
      inactive: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
    },
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500">{label}:</span>
      {options.map((opt) => {
        const isSelected = selected.includes(opt)
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
              isSelected ? colors[color].active : colors[color].inactive
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
