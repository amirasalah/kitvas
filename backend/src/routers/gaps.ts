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
  coOccurrenceCount: number; // How many high-performing videos pair this ingredient
  videoCount: number; // Total videos with base + this ingredient
  gapScore: number;
  demandBand: string | null;
  trendsInsight: string | null;
  trendsGrowth: number | null;
  isBreakout: boolean;
}

/**
 * Find ingredient pairing opportunities based on successful recipe videos.
 *
 * Strategy: Analyze high-performing videos that contain the searched ingredients
 * and find what other ingredients are commonly paired with them. This gives
 * recipe-level co-occurrence data (what ingredients actually work together)
 * rather than search-level data (what people searched for together).
 *
 * Gap Score Formula:
 * - High co-occurrence in successful videos = proven pairing
 * - Low total video count for the combination = content opportunity
 * - Google Trends boost for trending ingredients
 */
export const gapsRouter = t.router({
  findGaps: t.procedure
    .input(GapsInputSchema)
    .query(async ({ input, ctx }) => {
      const { ingredients } = input;
      const normalizedIngredients = ingredients.map(i => i.toLowerCase().trim());

      return findGapsFromRecipeAnalysis(ctx, normalizedIngredients);
    }),
});

/**
 * Find content gaps by analyzing successful recipe videos.
 *
 * This approach:
 * 1. Finds high-performing videos (by views) containing the base ingredients
 * 2. Extracts co-occurring ingredients from those videos
 * 3. Weights by video performance (views) - popular recipes = proven pairings
 * 4. Identifies gaps where pairing is common but dedicated content is rare
 */
async function findGapsFromRecipeAnalysis(
  ctx: Context,
  baseIngredients: string[]
): Promise<{
  baseIngredients: string[];
  gaps: IngredientGap[];
  totalVideos: number;
  source: 'recipe_analysis';
}> {
  // For single ingredient, require exact match
  // For multiple ingredients, require at least 2 or 50% (whichever is higher)
  const minMatch = baseIngredients.length === 1
    ? 1
    : Math.max(2, Math.ceil(baseIngredients.length * 0.5));

  // Find high-performing videos containing the base ingredients
  // Order by views to prioritize successful recipes
  const candidateVideos = await ctx.prisma.video.findMany({
    where: {
      views: { gte: 1000 }, // Only consider videos with meaningful traction
      videoIngredients: {
        some: {
          ingredient: {
            name: { in: baseIngredients },
          },
          confidence: { gte: 0.6 }, // Higher confidence threshold
        },
      },
    },
    include: {
      videoIngredients: {
        where: { confidence: { gte: 0.6 } },
        include: { ingredient: true },
      },
    },
    take: 100, // Top 100 by views
    orderBy: { views: 'desc' },
  });

  // Filter to videos that match enough base ingredients
  const relevantVideos = candidateVideos.filter(video => {
    const videoIngNames = new Set(video.videoIngredients.map(vi => vi.ingredient.name));
    const matchCount = baseIngredients.filter(ing => videoIngNames.has(ing)).length;
    return matchCount >= minMatch;
  });

  if (relevantVideos.length === 0) {
    return {
      baseIngredients,
      gaps: [],
      totalVideos: 0,
      source: 'recipe_analysis',
    };
  }

  // MINIMUM SAMPLE SIZE: Need at least 5 videos to provide meaningful gap suggestions
  // With fewer videos, co-occurrence data is statistically meaningless
  if (relevantVideos.length < 5) {
    return {
      baseIngredients,
      gaps: [],
      totalVideos: relevantVideos.length,
      source: 'recipe_analysis',
    };
  }

  // Analyze co-occurring ingredients weighted by video performance
  // Higher views = more proven pairing
  const coOccurrences = new Map<string, {
    weightedScore: number; // Sum of log(views) for videos containing this ingredient
    rawCount: number; // Number of videos
    avgViews: number; // Average views of videos with this pairing
    totalViews: number;
  }>();

  for (const video of relevantVideos) {
    const views = video.views || 1000;
    const viewWeight = Math.log10(views); // Logarithmic to prevent outlier domination

    for (const vi of video.videoIngredients) {
      const ingName = vi.ingredient.name;
      // Skip base ingredients
      if (baseIngredients.includes(ingName)) continue;

      const existing = coOccurrences.get(ingName) || {
        weightedScore: 0,
        rawCount: 0,
        avgViews: 0,
        totalViews: 0,
      };

      coOccurrences.set(ingName, {
        weightedScore: existing.weightedScore + viewWeight,
        rawCount: existing.rawCount + 1,
        totalViews: existing.totalViews + views,
        avgViews: 0, // Calculated below
      });
    }
  }

  // Calculate average views and filter
  for (const [ing, data] of coOccurrences.entries()) {
    data.avgViews = data.totalViews / data.rawCount;
    coOccurrences.set(ing, data);
  }

  // Filter: require ingredient to appear in at least 15% of relevant videos
  // or at least 3 videos (whichever is lower for small samples)
  const minOccurrences = Math.min(3, Math.ceil(relevantVideos.length * 0.15));

  const gaps: IngredientGap[] = [];

  for (const [ingredient, data] of coOccurrences.entries()) {
    if (data.rawCount < minOccurrences) continue;

    // Count videos that have BOTH base ingredients AND this ingredient
    // This tells us how much content exists for this specific combination
    const combinedVideoCount = await ctx.prisma.video.count({
      where: {
        AND: [
          ...baseIngredients.map(ing => ({
            videoIngredients: {
              some: {
                ingredient: { name: ing },
                confidence: { gte: 0.5 },
              },
            },
          })),
          {
            videoIngredients: {
              some: {
                ingredient: { name: ingredient },
                confidence: { gte: 0.5 },
              },
            },
          },
        ],
      },
    });

    // Gap Score:
    // - High co-occurrence score (proven pairing) = good
    // - Low combined video count (content gap) = opportunity
    // - Formula: (pairing strength) / (content saturation + 1)
    const pairingStrength = data.weightedScore * (data.rawCount / relevantVideos.length);
    let gapScore = pairingStrength / (combinedVideoCount + 1);

    // Boost for very high average views (indicates the pairing is successful)
    if (data.avgViews > 100000) {
      gapScore *= 1.5;
    } else if (data.avgViews > 50000) {
      gapScore *= 1.25;
    }

    // Apply Google Trends boost
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

    // Get demand band if we have cached data
    const allIngredients = [...baseIngredients, ingredient];
    const cacheKey = [...allIngredients].sort().join('|');
    const demandSignal = await ctx.prisma.demandSignal.findUnique({
      where: { ingredientKey: cacheKey },
      select: { demandBand: true },
    });

    gaps.push({
      ingredient,
      coOccurrenceCount: data.rawCount,
      videoCount: combinedVideoCount,
      gapScore,
      demandBand: demandSignal?.demandBand || null,
      trendsInsight,
      trendsGrowth,
      isBreakout,
    });
  }

  // Sort by gap score (best opportunities first)
  gaps.sort((a, b) => b.gapScore - a.gapScore);

  return {
    baseIngredients,
    gaps: gaps.slice(0, 10),
    totalVideos: relevantVideos.length,
    source: 'recipe_analysis',
  };
}
