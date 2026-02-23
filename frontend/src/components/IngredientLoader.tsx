'use client'

import { useMemo } from 'react'
import { IngredientIcon } from '@/lib/ingredient-illustrations'

/**
 * Animated ingredient loader that replaces the plain spinner.
 * Shows hand-drawn illustrations of the searched ingredients
 * floating in gentle drift motion.
 */
export function IngredientLoader({ ingredients }: { ingredients: string[] }) {
  // Generate stable random animation params per ingredient
  const animationParams = useMemo(() => {
    return ingredients.map((_, i) => {
      // Use deterministic "randomness" based on index for stable renders
      const seed = (i * 137 + 47) % 100
      return {
        delay: (i * 0.4) % 2,                    // staggered 0–2s
        duration: 4 + (seed % 30) / 10,           // 4–7s
        offsetX: ((i % 3) - 1) * 40,              // spread horizontally: -40, 0, 40
        rotation: ((seed % 20) - 10),              // ±10deg max rotation in animation
        scale: 0.9 + (seed % 20) / 100,           // 0.9–1.1 scale
      }
    })
  }, [ingredients])

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Floating ingredients area */}
      <div className="relative flex items-center justify-center gap-8 min-h-[180px] mb-6">
        {ingredients.map((ingredient, i) => {
          const params = animationParams[i]
          return (
            <div
              key={`${ingredient}-${i}`}
              className="flex flex-col items-center gap-2 animate-ingredient-drift"
              style={{
                animationDelay: `${params.delay}s`,
                animationDuration: `${params.duration}s`,
                transform: `translateX(${params.offsetX}px) scale(${params.scale})`,
                '--drift-rotation': `${params.rotation}deg`,
              } as React.CSSProperties}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md">
                <IngredientIcon
                  name={ingredient}
                  className="w-full h-full"
                />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-500 capitalize whitespace-nowrap">
                {ingredient}
              </span>
            </div>
          )
        })}
      </div>

      {/* Subtle loading text */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-gray-400 text-sm font-medium">Analyzing ingredients...</p>
      </div>
    </div>
  )
}
