import { z } from 'zod';
import { initTRPC } from '@trpc/server';
import type { Context } from '../context.js';
import { getTrendsBoost } from '../lib/google-trends/fetcher.js';

const t = initTRPC.context<Context>().create();

const GapsInputSchema = z.object({
  ingredients: z.array(z.string()).min(1).max(5),
});

export interface IngredientGap {
  ingredient: string;
  searchCount: number;
  videoCount: number;
  gapScore: number;
  demandBand: string | null;
  trendsInsight: string | null;
  trendsGrowth: number | null;
  isBreakout: boolean;
}

/**
 * Find ingredient combinations that are frequently searched
 * but have few videos - these are content opportunities.
 */
export const gapsRouter = t.router({
  findGaps: t.procedure
    .input(GapsInputSchema)
    .query(async ({ input, ctx }) => {
      const { ingredients } = input;
      const normalizedIngredients = ingredients.map(i => i.toLowerCase().trim());

      // 1. Find all searches that contain ALL base ingredients
      const relatedSearches = await ctx.prisma.search.findMany({
        where: {
          ingredients: { hasEvery: normalizedIngredients },
        },
        select: { ingredients: true },
      });

      // If insufficient search data, fall back to video co-occurrence
      if (relatedSearches.length < 5) {
        return findGapsFromVideoData(ctx, normalizedIngredients);
      }

      // 2. Count co-occurring ingredients (excluding base ingredients)
      const coOccurrences = new Map<string, number>();
      for (const search of relatedSearches) {
        for (const ing of search.ingredients) {
          if (!normalizedIngredients.includes(ing)) {
            coOccurrences.set(ing, (coOccurrences.get(ing) || 0) + 1);
          }
        }
      }

      // 3. For each co-occurring ingredient, check video count
      const gaps: IngredientGap[] = [];
      for (const [ingredient, searchCount] of coOccurrences.entries()) {
        if (searchCount < 2) continue; // Need minimum signal

        // Count videos with base ingredients + this ingredient
        const allIngredients = [...normalizedIngredients, ingredient];
        const videoCount = await ctx.prisma.video.count({
          where: {
            AND: allIngredients.map(ing => ({
              videoIngredients: {
                some: { ingredient: { name: ing } },
              },
            })),
          },
        });

        // Get demand signal if exists
        const cacheKey = [...allIngredients].sort().join('|');
        const demandSignal = await ctx.prisma.demandSignal.findUnique({
          where: { ingredientKey: cacheKey },
          select: { demandBand: true },
        });

        // Calculate base gap score
        let gapScore = searchCount / Math.max(1, videoCount);

        // Apply Google Trends boost multiplier
        const trendsBoost = await getTrendsBoost(ctx.prisma, [ingredient]);
        let trendsInsight: string | null = null;
        let trendsGrowth: number | null = null;
        let isBreakout = false;

        if (trendsBoost) {
          trendsGrowth = trendsBoost.weekOverWeekGrowth;
          isBreakout = trendsBoost.isBreakout;

          // Breakout = double opportunity
          if (trendsBoost.isBreakout) {
            gapScore *= 2.0;
            trendsInsight = '🚀 BREAKOUT - Immediate opportunity window';
          }
          // Strong growth = 50% boost
          else if (trendsBoost.weekOverWeekGrowth > 30) {
            gapScore *= 1.5;
            trendsInsight = `📈 Trending up ${Math.round(trendsBoost.weekOverWeekGrowth)}% this week`;
          }
          // Moderate growth = 25% boost
          else if (trendsBoost.weekOverWeekGrowth > 10) {
            gapScore *= 1.25;
            trendsInsight = `↗️ Growing interest (+${Math.round(trendsBoost.weekOverWeekGrowth)}%)`;
          }
          // Declining = reduce priority
          else if (trendsBoost.weekOverWeekGrowth < -20) {
            gapScore *= 0.75;
            trendsInsight = `↘️ Declining interest (${Math.round(trendsBoost.weekOverWeekGrowth)}%)`;
          }
        }

        gaps.push({
          ingredient,
          searchCount,
          videoCount,
          gapScore,
          demandBand: demandSignal?.demandBand || null,
          trendsInsight,
          trendsGrowth,
          isBreakout,
        });
      }

      // Sort by gap score (highest opportunity first)
      gaps.sort((a, b) => b.gapScore - a.gapScore);

      return {
        baseIngredients: normalizedIngredients,
        gaps: gaps.slice(0, 10),
        totalSearches: relatedSearches.length,
        source: 'search_patterns' as const,
      };
    }),
});

/**
 * Fallback: Find gaps from video co-occurrence data
 * Used when search history is insufficient
 */
async function findGapsFromVideoData(
  ctx: Context,
  baseIngredients: string[]
): Promise<{
  baseIngredients: string[];
  gaps: IngredientGap[];
  totalSearches: number;
  source: 'video_analysis';
}> {
  // Find videos that contain ALL base ingredients
  const videosWithBase = await ctx.prisma.video.findMany({
    where: {
      AND: baseIngredients.map(ing => ({
        videoIngredients: {
          some: { ingredient: { name: ing } },
        },
      })),
    },
    include: {
      videoIngredients: {
        include: { ingredient: true },
      },
    },
    take: 100,
    orderBy: { views: 'desc' },
  });

  if (videosWithBase.length === 0) {
    return {
      baseIngredients,
      gaps: [],
      totalSearches: 0,
      source: 'video_analysis',
    };
  }

  // Count co-occurring ingredients weighted by video views
  const coOccurrences = new Map<string, { count: number; totalViews: number }>();
  for (const video of videosWithBase) {
    const views = video.views || 1;
    for (const vi of video.videoIngredients) {
      const ingName = vi.ingredient.name;
      if (!baseIngredients.includes(ingName)) {
        const existing = coOccurrences.get(ingName) || { count: 0, totalViews: 0 };
        coOccurrences.set(ingName, {
          count: existing.count + 1,
          totalViews: existing.totalViews + views,
        });
      }
    }
  }

  // Find ingredients that appear in HIGH-performing videos but are RARE overall
  const gaps: IngredientGap[] = [];
  for (const [ingredient, data] of coOccurrences.entries()) {
    if (data.count < 2) continue;

    const avgViews = data.totalViews / data.count;

    // Count total videos with this ingredient in database
    const totalVideoCount = await ctx.prisma.video.count({
      where: {
        videoIngredients: {
          some: { ingredient: { name: ingredient } },
        },
      },
    });

    // Gap score: high avg views + low overall video count = opportunity
    // Normalize: avgViews/100000 gives rough scale, divided by video count
    let gapScore = (avgViews / 100000) / Math.max(1, totalVideoCount / 10);

    // Apply Google Trends boost multiplier
    const trendsBoost = await getTrendsBoost(ctx.prisma, [ingredient]);
    let trendsInsight: string | null = null;
    let trendsGrowth: number | null = null;
    let isBreakout = false;

    if (trendsBoost) {
      trendsGrowth = trendsBoost.weekOverWeekGrowth;
      isBreakout = trendsBoost.isBreakout;

      if (trendsBoost.isBreakout) {
        gapScore *= 2.0;
        trendsInsight = '🚀 BREAKOUT - Immediate opportunity window';
      } else if (trendsBoost.weekOverWeekGrowth > 30) {
        gapScore *= 1.5;
        trendsInsight = `📈 Trending up ${Math.round(trendsBoost.weekOverWeekGrowth)}% this week`;
      } else if (trendsBoost.weekOverWeekGrowth > 10) {
        gapScore *= 1.25;
        trendsInsight = `↗️ Growing interest (+${Math.round(trendsBoost.weekOverWeekGrowth)}%)`;
      } else if (trendsBoost.weekOverWeekGrowth < -20) {
        gapScore *= 0.75;
        trendsInsight = `↘️ Declining interest (${Math.round(trendsBoost.weekOverWeekGrowth)}%)`;
      }
    }

    gaps.push({
      ingredient,
      searchCount: data.count, // Actually video co-occurrence count
      videoCount: totalVideoCount,
      gapScore,
      demandBand: null,
      trendsInsight,
      trendsGrowth,
      isBreakout,
    });
  }

  gaps.sort((a, b) => b.gapScore - a.gapScore);

  return {
    baseIngredients,
    gaps: gaps.slice(0, 10),
    totalSearches: videosWithBase.length,
    source: 'video_analysis',
  };
}
