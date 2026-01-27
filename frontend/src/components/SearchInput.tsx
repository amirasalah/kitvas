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

      {/* Tags filter will be implemented later */}
    </div>
  )
}
