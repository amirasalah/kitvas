/**
 * Analytics Router
 *
 * Provides insights and ML training data endpoints:
 * - Trending ingredients (7d/30d/90d)
 * - Seasonal patterns
 * - Content gaps (underserved ingredient combinations)
 * - Ingredient co-occurrence
 * - Extraction accuracy tracking
 * - Opportunity calibration data
 * - Dashboard summary
 */

import { z } from 'zod';
import { initTRPC } from '@trpc/server';
import type { Context } from '../context.js';

const t = initTRPC.context<Context>().create();

export const analyticsRouter = t.router({
  /**
   * Get trending ingredients by search volume
   * Returns top ingredients with growth compared to previous period
   */
  trending: t.procedure
    .input(
      z.object({
        period: z.enum(['7d', '30d', '90d']).default('7d'),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const { period, limit } = input;

      // Calculate date ranges
      const now = new Date();
      const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const currentStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
      const previousStart = new Date(currentStart.getTime() - periodDays * 24 * 60 * 60 * 1000);

      // Get searches in current period
      const currentSearches = await ctx.prisma.search.findMany({
        where: { createdAt: { gte: currentStart } },
        select: { ingredients: true },
      });

      // Get searches in previous period (for growth calculation)
      const previousSearches = await ctx.prisma.search.findMany({
        where: {
          createdAt: { gte: previousStart, lt: currentStart },
        },
        select: { ingredients: true },
      });

      // Count ingredient occurrences
      const currentCounts = new Map<string, number>();
      for (const search of currentSearches) {
        for (const ing of search.ingredients) {
          currentCounts.set(ing, (currentCounts.get(ing) || 0) + 1);
        }
      }

      const previousCounts = new Map<string, number>();
      for (const search of previousSearches) {
        for (const ing of search.ingredients) {
          previousCounts.set(ing, (previousCounts.get(ing) || 0) + 1);
        }
      }

      // Sort by current count and calculate growth
      const trending = Array.from(currentCounts.entries())
        .map(([ingredient, searchCount]) => {
          const prevCount = previousCounts.get(ingredient) || 0;
          const growth = prevCount > 0
            ? ((searchCount - prevCount) / prevCount) * 100
            : searchCount > 0 ? 100 : 0; // New ingredient = 100% growth

          return { ingredient, searchCount, growth: Math.round(growth) };
        })
        .sort((a, b) => b.searchCount - a.searchCount)
        .slice(0, limit);

      // Get video counts for these ingredients
      const ingredientNames = trending.map((t) => t.ingredient);
      const ingredients = await ctx.prisma.ingredient.findMany({
        where: { name: { in: ingredientNames } },
        include: {
          _count: { select: { videoIngredients: true } },
        },
      });

      const videoCountMap = new Map(
        ingredients.map((i) => [i.name, i._count.videoIngredients])
      );

      return {
        period,
        periodStart: currentStart.toISOString(),
        periodEnd: now.toISOString(),
        totalSearches: currentSearches.length,
        trending: trending.map((t) => ({
          ...t,
          videoCount: videoCountMap.get(t.ingredient) || 0,
        })),
      };
    }),

  /**
   * Get seasonal patterns - ingredient popularity by month
   * Useful for planning seasonal content
   */
  seasonal: t.procedure
    .input(
      z.object({
        ingredient: z.string().optional(), // Filter to specific ingredient
        months: z.number().min(3).max(24).default(12), // How many months back
      })
    )
    .query(async ({ input, ctx }) => {
      const { ingredient, months } = input;

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const searches = await ctx.prisma.search.findMany({
        where: { createdAt: { gte: startDate } },
        select: { ingredients: true, createdAt: true },
      });

      // Group by month
      const monthlyData = new Map<string, Map<string, number>>();

      for (const search of searches) {
        const monthKey = `${search.createdAt.getFullYear()}-${String(search.createdAt.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, new Map());
        }

        const monthIngredients = monthlyData.get(monthKey)!;
        for (const ing of search.ingredients) {
          if (!ingredient || ing === ingredient) {
            monthIngredients.set(ing, (monthIngredients.get(ing) || 0) + 1);
          }
        }
      }

      // Format output
      const patterns = Array.from(monthlyData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, ingredients]) => {
          const topIngredients = Array.from(ingredients.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, searchCount: count }));

          return {
            month,
            totalSearches: Array.from(ingredients.values()).reduce((a, b) => a + b, 0),
            topIngredients,
          };
        });

      return { months, patterns };
    }),

  /**
   * Get content gaps - underserved ingredient combinations
   * High search volume but low video count = opportunity
   */
  contentGaps: t.procedure
    .input(
      z.object({
        minSearches: z.number().min(1).default(5),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const { minSearches, limit } = input;

      // Get demand signals with gap scores
      const demandSignals = await ctx.prisma.demandSignal.findMany({
        where: {
          contentGapScore: { gte: 50 }, // Only significant gaps
        },
        orderBy: { contentGapScore: 'desc' },
        take: limit * 2, // Get more to filter
      });

      // Count recent searches for each ingredient key
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const searches = await ctx.prisma.search.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { ingredients: true },
      });

      // Build search count map (by sorted ingredient key)
      const searchCounts = new Map<string, number>();
      for (const search of searches) {
        const key = [...search.ingredients].sort().join('|');
        searchCounts.set(key, (searchCounts.get(key) || 0) + 1);
      }

      // Combine demand signals with search counts
      const gaps = demandSignals
        .map((ds) => ({
          ingredients: ds.ingredients,
          ingredientKey: ds.ingredientKey,
          searchCount: searchCounts.get(ds.ingredientKey) || 0,
          videoCount: ds.videoCount,
          gapScore: ds.contentGapScore,
          gapType: ds.contentGapType,
          demandBand: ds.demandBand,
          avgViews: ds.avgViews,
        }))
        .filter((g) => g.searchCount >= minSearches)
        .sort((a, b) => b.gapScore - a.gapScore)
        .slice(0, limit);

      return {
        minSearches,
        gaps,
      };
    }),

  /**
   * Get ingredient co-occurrence - what ingredients are searched together
   */
  coOccurrence: t.procedure
    .input(
      z.object({
        ingredient: z.string(),
        limit: z.number().min(1).max(30).default(15),
      })
    )
    .query(async ({ input, ctx }) => {
      const { ingredient, limit } = input;
      const normalizedIngredient = ingredient.toLowerCase().trim();

      // Get searches containing this ingredient
      const searches = await ctx.prisma.search.findMany({
        where: {
          ingredients: { has: normalizedIngredient },
        },
        select: { ingredients: true },
      });

      // Count co-occurring ingredients
      const coOccurrences = new Map<string, number>();
      for (const search of searches) {
        for (const ing of search.ingredients) {
          if (ing !== normalizedIngredient) {
            coOccurrences.set(ing, (coOccurrences.get(ing) || 0) + 1);
          }
        }
      }

      // Get video performance for pairs
      const pairs = Array.from(coOccurrences.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      // Look up demand signals for pairs
      const pairKeys = pairs.map(([pairedWith]) =>
        [normalizedIngredient, pairedWith].sort().join('|')
      );

      const demandSignals = await ctx.prisma.demandSignal.findMany({
        where: { ingredientKey: { in: pairKeys } },
      });

      const demandMap = new Map(demandSignals.map((ds) => [ds.ingredientKey, ds]));

      return {
        ingredient: normalizedIngredient,
        totalSearches: searches.length,
        coOccurrences: pairs.map(([pairedWith, coSearchCount]) => {
          const key = [normalizedIngredient, pairedWith].sort().join('|');
          const demand = demandMap.get(key);

          return {
            pairedWith,
            coSearchCount,
            avgViews: demand?.avgViews || null,
            demandBand: demand?.demandBand || null,
            contentGapScore: demand?.contentGapScore || null,
          };
        }),
      };
    }),

  /**
   * Get extraction accuracy metrics
   * Shows current precision/recall/F1 and historical trend
   */
  extractionAccuracy: t.procedure.query(async ({ ctx }) => {
    // Get latest accuracy snapshot
    const latest = await ctx.prisma.accuracySnapshot.findFirst({
      orderBy: { measuredAt: 'desc' },
    });

    // Get historical snapshots (last 10)
    const history = await ctx.prisma.accuracySnapshot.findMany({
      orderBy: { measuredAt: 'desc' },
      take: 10,
    });

    // Get correction stats for context
    const totalCorrections = await ctx.prisma.correction.count();
    const recentCorrections = await ctx.prisma.correction.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    // Get extraction feedback stats
    const feedbackStats = await ctx.prisma.extractionFeedback.groupBy({
      by: ['feedbackType'],
      _count: { id: true },
      _sum: { occurrences: true },
    });

    return {
      current: latest
        ? {
            precision: latest.precision,
            recall: latest.recall,
            f1: latest.f1,
            exactMatch: latest.exactMatch,
            sampleSize: latest.sampleSize,
            measuredAt: latest.measuredAt,
          }
        : null,
      history: history.map((h) => ({
        f1: h.f1,
        measuredAt: h.measuredAt,
      })),
      corrections: {
        total: totalCorrections,
        lastWeek: recentCorrections,
      },
      feedback: feedbackStats.map((f) => ({
        type: f.feedbackType,
        patterns: f._count.id,
        totalOccurrences: f._sum.occurrences || 0,
      })),
    };
  }),

  /**
   * Get opportunity calibration data
   * Shows how accurate opportunity predictions have been
   */
  opportunityCalibration: t.procedure.query(async ({ ctx }) => {
    // Get stored calibration data
    const calibrations = await ctx.prisma.opportunityCalibration.findMany({
      orderBy: [{ demandBand: 'asc' }, { opportunityScore: 'asc' }],
    });

    // Get raw outcome stats for comparison
    const outcomes = await ctx.prisma.outcome.findMany({
      where: { rating: { not: null } },
      include: {
        trackedOpportunity: {
          select: { opportunityScore: true, ingredients: true },
        },
      },
    });

    // Calculate live stats by opportunity score
    const liveStats = new Map<string, { count: number; totalViews: number; totalRating: number; successCount: number }>();

    for (const outcome of outcomes) {
      const score = outcome.trackedOpportunity.opportunityScore;
      const stats = liveStats.get(score) || { count: 0, totalViews: 0, totalRating: 0, successCount: 0 };

      stats.count++;
      stats.totalViews += outcome.views7day || 0;
      stats.totalRating += outcome.rating || 0;
      if ((outcome.rating || 0) >= 4) stats.successCount++;

      liveStats.set(score, stats);
    }

    return {
      calibrations: calibrations.map((c) => ({
        demandBand: c.demandBand,
        opportunityScore: c.opportunityScore,
        totalOutcomes: c.totalOutcomes,
        avgViews7day: c.avgViews7day,
        avgRating: c.avgRating,
        successRate: c.successRate,
        calculatedAt: c.calculatedAt,
      })),
      liveStats: Array.from(liveStats.entries()).map(([score, stats]) => ({
        opportunityScore: score,
        count: stats.count,
        avgViews7day: stats.count > 0 ? Math.round(stats.totalViews / stats.count) : 0,
        avgRating: stats.count > 0 ? +(stats.totalRating / stats.count).toFixed(2) : 0,
        successRate: stats.count > 0 ? +(stats.successCount / stats.count).toFixed(2) : 0,
      })),
      totalOutcomes: outcomes.length,
    };
  }),

  /**
   * Dashboard summary - single endpoint for insights UI
   */
  dashboard: t.procedure.query(async ({ ctx }) => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel queries for dashboard data
    const [
      weeklySearches,
      weeklyCorrections,
      weeklyOutcomes,
      latestAccuracy,
      topTrending,
      topGaps,
    ] = await Promise.all([
      ctx.prisma.search.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      ctx.prisma.correction.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      ctx.prisma.outcome.count({ where: { reportedAt: { gte: sevenDaysAgo } } }),
      ctx.prisma.accuracySnapshot.findFirst({ orderBy: { measuredAt: 'desc' } }),
      // Top 5 trending (simplified)
      ctx.prisma.search.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { ingredients: true },
      }),
      // Top gaps
      ctx.prisma.demandSignal.findMany({
        where: { contentGapScore: { gte: 60 } },
        orderBy: { contentGapScore: 'desc' },
        take: 5,
      }),
    ]);

    // Calculate trending from searches
    const ingredientCounts = new Map<string, number>();
    for (const search of topTrending) {
      for (const ing of search.ingredients) {
        ingredientCounts.set(ing, (ingredientCounts.get(ing) || 0) + 1);
      }
    }

    const trending = Array.from(ingredientCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ingredient, count]) => ({ ingredient, searchCount: count }));

    return {
      weeklyStats: {
        searches: weeklySearches,
        corrections: weeklyCorrections,
        outcomes: weeklyOutcomes,
      },
      accuracy: latestAccuracy
        ? {
            f1: latestAccuracy.f1,
            trend: 'stable' as const, // Would need historical comparison
            measuredAt: latestAccuracy.measuredAt,
          }
        : null,
      trending,
      topGaps: topGaps.map((g) => ({
        ingredients: g.ingredients,
        gapScore: g.contentGapScore,
        demandBand: g.demandBand,
      })),
    };
  }),

  /**
   * Export corrections for training data
   */
  exportCorrections: t.procedure
    .input(
      z.object({
        since: z.date().optional(),
        limit: z.number().min(1).max(10000).default(1000),
      })
    )
    .query(async ({ input, ctx }) => {
      const { since, limit } = input;

      const corrections = await ctx.prisma.correction.findMany({
        where: since ? { createdAt: { gte: since } } : undefined,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          video: { select: { title: true, description: true } },
          ingredient: { select: { name: true } },
        },
      });

      return {
        count: corrections.length,
        corrections: corrections.map((c) => ({
          videoTitle: c.video.title,
          videoDescription: c.video.description,
          ingredientName: c.ingredient.name,
          action: c.action,
          suggestedName: c.suggestedName,
          createdAt: c.createdAt,
        })),
      };
    }),

  /**
   * Get extraction feedback patterns (for prompt improvement)
   */
  extractionFeedback: t.procedure
    .input(
      z.object({
        type: z.enum(['false_positive', 'false_negative', 'rename', 'all']).default('all'),
        incorporated: z.boolean().optional(),
        minOccurrences: z.number().min(1).default(2),
      })
    )
    .query(async ({ input, ctx }) => {
      const { type, incorporated, minOccurrences } = input;

      const where: any = {
        occurrences: { gte: minOccurrences },
      };

      if (type !== 'all') {
        where.feedbackType = type;
      }

      if (incorporated !== undefined) {
        where.incorporated = incorporated;
      }

      const feedback = await ctx.prisma.extractionFeedback.findMany({
        where,
        orderBy: { occurrences: 'desc' },
      });

      return {
        count: feedback.length,
        feedback: feedback.map((f) => ({
          pattern: f.pattern,
          feedbackType: f.feedbackType,
          correctValue: f.correctValue,
          occurrences: f.occurrences,
          incorporated: f.incorporated,
          updatedAt: f.updatedAt,
        })),
      };
    }),
});
