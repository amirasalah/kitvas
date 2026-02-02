'use client';

import { trpc } from '@/app/providers';

interface ContentAnglesProps {
  ingredients: string[];
}

export function ContentAngles({ ingredients }: ContentAnglesProps) {
  // Use the first ingredient for related angles lookup
  const primaryIngredient = ingredients[0];

  const { data, isLoading } = trpc.analytics.relatedAngles.useQuery(
    { ingredient: primaryIngredient, limit: 5 },
    { enabled: !!primaryIngredient }
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.hasData) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-2xl border border-blue-100 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-blue-900">Content Angles</h3>
          <p className="text-sm text-blue-600">Rising searches for &quot;{data.ingredient}&quot;</p>
        </div>
      </div>

      <div className="space-y-2">
        {data.contentAngles.map((angle, index) => (
          <div
            key={angle.query}
            className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100 hover:border-blue-200 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">&quot;{angle.query}&quot;</span>
                {angle.isBreakout && (
                  <span className="text-xs px-2 py-0.5 bg-red-500 text-white rounded-full font-bold animate-pulse">
                    BREAKOUT
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{angle.suggestion}</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {angle.growth !== null && (
                <span className={`text-sm font-semibold ${
                  angle.growth > 100 ? 'text-red-600' :
                  angle.growth > 50 ? 'text-orange-600' :
                  'text-emerald-600'
                }`}>
                  +{angle.growth > 1000 ? `${Math.round(angle.growth / 100) * 100}` : angle.growth}%
                </span>
              )}
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-blue-500 mt-4 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Based on Google Trends rising queries. Consider these angles for your content.
      </p>
    </div>
  );
}
