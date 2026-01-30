'use client';

import { trpc } from '@/app/providers';

interface IngredientGapsProps {
  ingredients: string[];
  onAddIngredient?: (ingredient: string) => void;
}

export function IngredientGaps({ ingredients, onAddIngredient }: IngredientGapsProps) {
  const { data, isLoading } = trpc.gaps.findGaps.useQuery(
    { ingredients },
    { enabled: ingredients.length >= 1 }
  );

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!data || data.gaps.length === 0) return null;

  const sourceLabel = data.source === 'search_patterns'
    ? `Based on ${data.totalSearches} related searches`
    : `Based on ${data.totalSearches} similar videos`;

  return (
    <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
      <h3 className="font-semibold text-purple-900 mb-2">
        Content Opportunities
      </h3>
      <p className="text-sm text-purple-700 mb-3">
        {sourceLabel}, consider adding:
      </p>
      <div className="flex flex-wrap gap-2">
        {data.gaps.map((gap) => (
          <button
            key={gap.ingredient}
            onClick={() => onAddIngredient?.(gap.ingredient)}
            className="px-3 py-2 bg-white rounded-lg border border-purple-200 shadow-sm hover:shadow-md hover:border-purple-400 transition-all cursor-pointer text-left"
            title={`Add "${gap.ingredient}" to search`}
          >
            <span className="font-medium text-purple-900">+{gap.ingredient}</span>
            <span className="text-xs text-gray-500 ml-2">
              {gap.searchCount} {data.source === 'search_patterns' ? 'searches' : 'videos'} · {gap.videoCount} total videos
            </span>
            {gap.gapScore > 5 && (
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                High opportunity
              </span>
            )}
            {gap.gapScore > 2 && gap.gapScore <= 5 && (
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                Opportunity
              </span>
            )}
            {gap.demandBand && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                gap.demandBand === 'hot' ? 'bg-red-100 text-red-700' :
                gap.demandBand === 'growing' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {gap.demandBand}
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-purple-500 mt-3">
        Click to add to your search. These ingredients are frequently paired with your search but have limited content coverage.
      </p>
    </div>
  );
}
