/**
 * Analytics Router
 *
 * Provides insights and ML training data endpoints:
 * - Hot ingredients from Google Trends (today/week/month)
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
   * Get hot ingredients from Google Trends
   * Returns top trending ingredients for today, this week, or this month
   */
  hotIngredients: t.procedure
    .input(
      z.object({
        period: z.enum(['today', 'week', 'month']).default('week'),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const { period, limit } = input;

      // Calculate date range based on period
      // "today" uses 2 days to ensure we have data even if today's fetch hasn't run yet
      const dateRange = {
        today: 2, // Last 48 hours to catch yesterday's data if today's isn't fetched yet
        week: 7,
        month: 30,
      }[period];

      const since = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);
      const previousPeriodStart = new Date(Date.now() - dateRange * 2 * 24 * 60 * 60 * 1000);

      // Get current period data from Google Trends
      const currentTrends = await ctx.prisma.googleTrend.groupBy({
        by: ['keyword'],
        where: { date: { gte: since } },
        _avg: { interestValue: true },
        orderBy: { _avg: { interestValue: 'desc' } },
        take: limit * 2, // Get extra to filter out low interest
      });

      if (currentTrends.length === 0) {
        // Fallback to internal search data if no Google Trends data
        return {
          period,
          source: 'internal' as const,
          ingredients: [],
          hasGoogleTrends: false,
        };
      }

      // Get breakout status for each keyword (can't aggregate boolean in PostgreSQL)
      const breakoutKeywords = await ctx.prisma.googleTrend.findMany({
        where: {
          keyword: { in: currentTrends.map((t) => t.keyword) },
          date: { gte: since },
          isBreakout: true,
        },
        select: { keyword: true },
        distinct: ['keyword'],
      });
      const breakoutSet = new Set(breakoutKeywords.map((b) => b.keyword));

      // Get previous period data for growth calculation
      const previousTrends = await ctx.prisma.googleTrend.groupBy({
        by: ['keyword'],
        where: {
          date: { gte: previousPeriodStart, lt: since },
          keyword: { in: currentTrends.map((t) => t.keyword) },
        },
        _avg: { interestValue: true },
      });

      const previousMap = new Map(previousTrends.map((t) => [t.keyword, t._avg.interestValue || 0]));

      // Build results with growth calculation
      const results = [];

      for (const trend of currentTrends) {
        if (results.length >= limit) break;

        const currentAvg = trend._avg.interestValue || 0;
        if (currentAvg < 10) continue; // Filter out very low interest

        const previousAvg = previousMap.get(trend.keyword) || currentAvg;
        let growth = 0;

        if (previousAvg > 0) {
          growth = ((currentAvg - previousAvg) / previousAvg) * 100;
        }

        results.push({
          name: trend.keyword,
          interest: Math.round(currentAvg),
          growth: Math.round(growth),
          isBreakout: breakoutSet.has(trend.keyword),
          rank: results.length + 1,
        });
      }

      return {
        period,
        source: 'google_trends' as const,
        ingredients: results,
        hasGoogleTrends: true,
      };
    }),

  /**
   * Get related content angles from Google Trends rising queries
   * Surfaces rising searches as content topic suggestions
   */
  relatedAngles: t.procedure
    .input(
      z.object({
        ingredient: z.string().min(1),
        limit: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ input, ctx }) => {
      const { ingredient, limit } = input;
      const normalizedIngredient = ingredient.toLowerCase().trim();

      // Get rising queries related to ingredient
      const risingQueries = await ctx.prisma.googleTrendRelatedQuery.findMany({
        where: {
          parentKeyword: normalizedIngredient,
          queryType: 'rising',
          value: { gt: 50 }, // Only significant growth
        },
        orderBy: { value: 'desc' },
        take: limit,
      });

      // Format suggestions with actionable insights
      const formatAngleSuggestion = (query: string, baseIngredient: string): string => {
        const cleanQuery = query.replace(baseIngredient, '').trim();
        if (query.includes('recipe')) return 'Recipe-focused content opportunity';
        if (query.includes('easy') || query.includes('simple')) return 'Beginner-friendly content angle';
        if (query.includes('healthy') || query.includes('keto') || query.includes('vegan')) return 'Health-conscious audience';
        if (query.includes('air fryer') || query.includes('instant pot')) return 'Appliance-specific content';
        if (cleanQuery.length > 0) return `Consider "${cleanQuery}" variations`;
        return 'Trending search variation';
      };

      return {
        ingredient: normalizedIngredient,
        contentAngles: risingQueries.map((q) => ({
          query: q.relatedQuery,
          growth: q.value,
          isBreakout: q.isBreakout,
          suggestion: formatAngleSuggestion(q.relatedQuery, normalizedIngredient),
        })),
        hasData: risingQueries.length > 0,
      };
    }),

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
   * Get per-ingredient extraction accuracy
   * Calculated from user corrections: (right - wrong) / total
   */
  ingredientAccuracy: t.procedure
    .input(
      z.object({
        minCorrections: z.number().min(1).default(3),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      const { minCorrections, limit } = input;

      // Get correction counts by ingredient
      const correctionStats = await ctx.prisma.correction.groupBy({
        by: ['ingredientId', 'action'],
        _count: { id: true },
      });

      // Aggregate by ingredient
      const ingredientStats = new Map<string, { right: number; wrong: number; add: number; rename: number }>();

      for (const stat of correctionStats) {
        if (!ingredientStats.has(stat.ingredientId)) {
          ingredientStats.set(stat.ingredientId, { right: 0, wrong: 0, add: 0, rename: 0 });
        }
        const stats = ingredientStats.get(stat.ingredientId)!;
        if (stat.action === 'right') stats.right = stat._count.id;
        else if (stat.action === 'wrong') stats.wrong = stat._count.id;
        else if (stat.action === 'add') stats.add = stat._count.id;
        else if (stat.action === 'rename') stats.rename = stat._count.id;
      }

      // Filter to ingredients with minimum corrections and calculate accuracy
      const ingredientIds = Array.from(ingredientStats.entries())
        .filter(([_, stats]) => stats.right + stats.wrong >= minCorrections)
        .map(([id]) => id);

      if (ingredientIds.length === 0) {
        return {
          minCorrections,
          ingredients: [],
          summary: {
            totalWithFeedback: 0,
            avgAccuracy: null,
            needsAttention: [],
          },
        };
      }

      // Get ingredient names
      const ingredients = await ctx.prisma.ingredient.findMany({
        where: { id: { in: ingredientIds } },
        select: { id: true, name: true },
      });

      const nameMap = new Map(ingredients.map((i) => [i.id, i.name]));

      // Build results
      const results = ingredientIds
        .map((id) => {
          const stats = ingredientStats.get(id)!;
          const total = stats.right + stats.wrong;
          const accuracy = total > 0 ? stats.right / total : null;

          return {
            ingredientId: id,
            name: nameMap.get(id) || 'Unknown',
            rightCount: stats.right,
            wrongCount: stats.wrong,
            addCount: stats.add,
            renameCount: stats.rename,
            totalCorrections: stats.right + stats.wrong + stats.add + stats.rename,
            accuracy,
          };
        })
        .filter((r) => r.accuracy !== null)
        .sort((a, b) => (a.accuracy || 0) - (b.accuracy || 0)) // Worst first
        .slice(0, limit);

      // Calculate summary
      const accuracies = results.map((r) => r.accuracy!).filter((a) => a !== null);
      const avgAccuracy = accuracies.length > 0
        ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
        : null;

      const needsAttention = results
        .filter((r) => r.accuracy !== null && r.accuracy < 0.7)
        .slice(0, 10)
        .map((r) => r.name);

      return {
        minCorrections,
        ingredients: results.map((r) => ({
          ...r,
          accuracy: r.accuracy !== null ? Math.round(r.accuracy * 100) / 100 : null,
        })),
        summary: {
          totalWithFeedback: results.length,
          avgAccuracy: avgAccuracy !== null ? Math.round(avgAccuracy * 100) / 100 : null,
          needsAttention,
        },
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
   * Get ingredient trend history (sparkline data)
   * Returns search and video counts over time for an ingredient
   */
  ingredientTrends: t.procedure
    .input(
      z.object({
        ingredient: z.string().min(1),
        period: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
        limit: z.number().min(1).max(52).default(12), // Up to 52 weeks
      })
    )
    .query(async ({ input, ctx }) => {
      const { ingredient, period, limit } = input;
      const normalizedIngredient = ingredient.toLowerCase().trim();

      // Find the ingredient
      const ingredientRecord = await ctx.prisma.ingredient.findUnique({
        where: { name: normalizedIngredient },
      });

      if (!ingredientRecord) {
        return {
          ingredient: normalizedIngredient,
          found: false,
          trends: [],
          summary: null,
        };
      }

      // Get trend data sorted by period
      const trends = await ctx.prisma.ingredientTrend.findMany({
        where: {
          ingredientId: ingredientRecord.id,
          period,
        },
        orderBy: { periodStart: 'desc' },
        take: limit,
      });

      // Reverse to get chronological order
      trends.reverse();

      // Calculate summary stats
      const totalSearches = trends.reduce((sum, t) => sum + t.searchCount, 0);
      const totalVideos = trends.reduce((sum, t) => sum + t.videoCount, 0);
      const avgViews = trends.filter((t) => t.avgViews !== null).length > 0
        ? Math.round(
            trends.reduce((sum, t) => sum + (t.avgViews || 0), 0) /
              trends.filter((t) => t.avgViews !== null).length
          )
        : null;

      // Calculate trend direction (last 4 periods vs previous 4)
      let trendDirection: 'up' | 'down' | 'stable' = 'stable';
      if (trends.length >= 8) {
        const recent = trends.slice(-4).reduce((sum, t) => sum + t.searchCount, 0);
        const previous = trends.slice(-8, -4).reduce((sum, t) => sum + t.searchCount, 0);
        if (recent > previous * 1.2) trendDirection = 'up';
        else if (recent < previous * 0.8) trendDirection = 'down';
      }

      return {
        ingredient: normalizedIngredient,
        found: true,
        period,
        trends: trends.map((t) => ({
          periodStart: t.periodStart.toISOString(),
          searchCount: t.searchCount,
          videoCount: t.videoCount,
          avgViews: t.avgViews,
        })),
        summary: {
          totalSearches,
          totalVideos,
          avgViews,
          trendDirection,
          periodsTracked: trends.length,
        },
      };
    }),

  /**
   * Get top trending ingredients by search velocity
   * Returns ingredients with highest search count growth
   */
  topIngredientTrends: t.procedure
    .input(
      z.object({
        period: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const { period, limit } = input;

      // Get the most recent period start for this period type
      const latestTrend = await ctx.prisma.ingredientTrend.findFirst({
        where: { period },
        orderBy: { periodStart: 'desc' },
        select: { periodStart: true },
      });

      if (!latestTrend) {
        return {
          period,
          periodStart: null,
          ingredients: [],
        };
      }

      // Get all trends for the latest period, sorted by search count
      const trends = await ctx.prisma.ingredientTrend.findMany({
        where: {
          period,
          periodStart: latestTrend.periodStart,
        },
        orderBy: { searchCount: 'desc' },
        take: limit,
        include: {
          ingredient: {
            select: { name: true },
          },
        },
      });

      // Get previous period data for growth calculation
      const previousPeriodStart = new Date(latestTrend.periodStart);
      if (period === 'daily') previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
      else if (period === 'weekly') previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
      else previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);

      const previousTrends = await ctx.prisma.ingredientTrend.findMany({
        where: {
          period,
          periodStart: previousPeriodStart,
          ingredientId: { in: trends.map((t) => t.ingredientId) },
        },
      });

      const previousMap = new Map(previousTrends.map((t) => [t.ingredientId, t.searchCount]));

      return {
        period,
        periodStart: latestTrend.periodStart.toISOString(),
        ingredients: trends.map((t) => {
          const previousCount = previousMap.get(t.ingredientId) || 0;
          const growth = previousCount > 0
            ? Math.round(((t.searchCount - previousCount) / previousCount) * 100)
            : t.searchCount > 0 ? 100 : 0;

          return {
            name: t.ingredient.name,
            searchCount: t.searchCount,
            videoCount: t.videoCount,
            avgViews: t.avgViews,
            growth,
          };
        }),
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
