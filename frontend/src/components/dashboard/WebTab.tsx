'use client'

import { trpc } from '@/app/providers'
import type { Period } from './TimePeriodSelector'

const SOURCE_LOGOS: Record<string, string> = {
  seriouseats: 'SE',
  bonappetit: 'BA',
  thekitchn: 'TK',
  foodnetwork: 'FN',
  allrecipes: 'AR',
  epicurious: 'EP',
  smittenkitchen: 'SK',
  minimalistbaker: 'MB',
}

const SOURCE_LABELS: Record<string, string> = {
  seriouseats: 'Serious Eats',
  bonappetit: 'Bon Appetit',
  thekitchn: 'The Kitchn',
  foodnetwork: 'Food Network',
  allrecipes: 'Allrecipes',
  epicurious: 'Epicurious',
  smittenkitchen: 'Smitten Kitchen',
  minimalistbaker: 'Minimalist Baker',
}

export function WebTab({ period }: { period: Period }) {
  const { data: articles, isLoading } = trpc.dashboard.webLatest.useQuery({ period })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-white/40 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">📰</div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No articles yet</h3>
        <p className="text-sm text-gray-500">
          Articles will appear after the RSS feed fetcher runs.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {articles.map((article: any) => (
        <a
          key={article.id}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-4 p-4 bg-white/50 rounded-xl border border-gray-100 hover:shadow-sm transition-all"
        >
          {article.imageUrl && (
            <img
              src={article.imageUrl}
              alt=""
              className="w-20 h-20 rounded-lg object-cover shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                {SOURCE_LOGOS[article.source] || article.source.slice(0, 2).toUpperCase()}
              </span>
              <span className="text-xs text-blue-600 font-medium">
                {SOURCE_LABELS[article.source] || article.source}
              </span>
            </div>
            <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
              {article.title}
            </h4>
            {article.excerpt && (
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">{article.excerpt}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400">
                {new Date(article.publishedAt).toLocaleDateString()}
              </span>
              {article.author && (
                <span className="text-xs text-gray-400">by {article.author}</span>
              )}
            </div>
            {article.ingredients.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {article.ingredients.slice(0, 3).map((ing: string) => (
                  <span
                    key={ing}
                    className="px-1.5 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 rounded capitalize"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            )}
          </div>
        </a>
      ))}
    </div>
  )
}
