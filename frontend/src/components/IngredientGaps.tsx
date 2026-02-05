'use client';

import { trpc } from '@/app/providers';

interface IngredientGapsProps {
  ingredients: string[];
  onAddIngredient?: (ingredient: string) => void;
  showContent?: boolean;
}

export function IngredientGaps({ ingredients, onAddIngredient, showContent = false }: IngredientGapsProps) {
  const { data, isLoading, error } = trpc.gaps.findGaps.useQuery(
    { ingredients },
    { enabled: ingredients.length >= 1 }
  );

  if (error) {
    return (
      <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
        <div className="flex items-center gap-3 text-red-600">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">Unable to load content opportunities</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 rounded-lg w-24"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-28"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.gaps.length === 0) return null;

  // If not showing content (user not logged in), don't render anything
  // The parent component handles the blurred preview
  if (!showContent) return null;

  const sourceLabel = `Based on ${data.totalVideos} high-performing recipes`;

  return (
    <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 rounded-2xl border border-purple-100 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-purple-900">Content Opportunities</h3>
          <p className="text-sm text-purple-600">{sourceLabel}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {data.gaps.map((gap) => (
          <button
            key={gap.ingredient}
            onClick={() => onAddIngredient?.(gap.ingredient)}
            className={`group px-4 py-2.5 bg-white rounded-xl border shadow-sm hover:shadow-md active:shadow-md transition-all cursor-pointer text-left ${
              gap.isBreakout
                ? 'border-red-300 ring-2 ring-red-100 hover:border-red-400 active:border-red-400'
                : 'border-purple-200 hover:border-purple-400 active:border-purple-400'
            }`}
            title={`Add "${gap.ingredient}" to search`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-purple-900 group-hover:text-purple-700">+{gap.ingredient}</span>
              {/* Breakout badge - highest priority */}
              {gap.isBreakout && (
                <span className="text-xs px-2 py-0.5 bg-red-500 text-white rounded-full font-bold animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  BREAKOUT
                </span>
              )}
              {/* Trends growth indicator */}
              {!gap.isBreakout && gap.trendsGrowth !== null && gap.trendsGrowth > 10 && (
                <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                  +{Math.round(gap.trendsGrowth)}%
                </span>
              )}
              {!gap.isBreakout && gap.trendsGrowth !== null && gap.trendsGrowth < -10 && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
                  {Math.round(gap.trendsGrowth)}%
                </span>
              )}
              {/* Gap score badges */}
              {gap.gapScore > 5 && !gap.isBreakout && (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                  High
                </span>
              )}
              {gap.gapScore > 2 && gap.gapScore <= 5 && !gap.isBreakout && (
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                  Good
                </span>
              )}
              {gap.demandBand && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  gap.demandBand === 'hot' ? 'bg-red-100 text-red-700' :
                  gap.demandBand === 'growing' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {gap.demandBand}
                </span>
              )}
            </div>
            {/* Trends insight text */}
            {gap.trendsInsight && (
              <div className="text-xs text-purple-600 mt-1 font-medium">
                {gap.trendsInsight}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {gap.coOccurrenceCount} pairings &middot; {gap.videoCount} videos
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-purple-500 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Click to add to your search. These ingredients have high demand but limited content.
      </p>
    </div>
  );
}
