/**
 * Google Trends Fetcher Service
 *
 * High-level service for fetching and storing trends data.
 * Integrates with Prisma for persistence and handles caching.
 */

import { PrismaClient } from '@prisma/client';
import { GoogleTrendsClient, getDefaultClient } from './client.js';
import type { FetchResult, TrendsBoost, HotIngredient } from './types.js';

export class GoogleTrendsFetcher {
  private client: GoogleTrendsClient;
  private prisma: PrismaClient;
  private cacheTtlMs: number;

  constructor(prisma: PrismaClient, options?: { client?: GoogleTrendsClient; cacheTtlHours?: number }) {
    this.client = options?.client || getDefaultClient();
    this.prisma = prisma;
    this.cacheTtlMs = (options?.cacheTtlHours || 24) * 60 * 60 * 1000;
  }

  /**
   * Get keywords to track based on:
   * 1. Top searched ingredients (last 30 days)
   * 2. Ingredients with high demand signals
   * 3. Ingredients from tracked opportunities
   */
  async getKeywordsToTrack(limit: number = 50): Promise<string[]> {
    const keywords = new Set<string>();

    // Priority 1: Top 20 searched ingredients (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const topSearched = await this.prisma.search.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { ingredients: true },
    });

    const ingredientCounts = new Map<string, number>();
    for (const search of topSearched) {
      for (const ingredient of search.ingredients) {
        const normalized = ingredient.toLowerCase().trim();
        ingredientCounts.set(normalized, (ingredientCounts.get(normalized) || 0) + 1);
      }
    }

    // Sort by count and take top 20
    const sortedIngredients = [...ingredientCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name]) => name);

    sortedIngredients.forEach((k) => keywords.add(k));

    // Priority 2: Hot/Growing demand signals (15 keywords)
    const highDemandSignals = await this.prisma.demandSignal.findMany({
      where: { demandBand: { in: ['hot', 'growing'] } },
      orderBy: { demandScore: 'desc' },
      take: 15,
      select: { ingredients: true },
    });

    for (const signal of highDemandSignals) {
      for (const ingredient of signal.ingredients.slice(0, 2)) {
        // Take first 2 ingredients from each combination
        keywords.add(ingredient.toLowerCase().trim());
      }
    }

    // Priority 3: Tracked opportunity ingredients (10 keywords)
    const trackedOpportunities = await this.prisma.trackedOpportunity.findMany({
      where: { status: { in: ['researching', 'filming'] } },
      take: 10,
      select: { ingredients: true },
    });

    for (const opp of trackedOpportunities) {
      for (const ingredient of opp.ingredients.slice(0, 2)) {
        keywords.add(ingredient.toLowerCase().trim());
      }
    }

    return Array.from(keywords).slice(0, limit);
  }

  /**
   * Fetch and store trends for a list of keywords
   */
  async fetchAndStoreKeywords(
    keywords: string[],
    onProgress?: (completed: number, total: number, keyword: string) => void
  ): Promise<FetchResult> {
    const result: FetchResult = {
      fetched: 0,
      cached: 0,
      errors: 0,
      breakouts: [],
    };

    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];

      try {
        // Check cache first
        const cached = await this.getCachedTrends(keyword);
        if (cached) {
          result.cached++;
          onProgress?.(i + 1, keywords.length, keyword);
          continue;
        }

        // Fetch from Google Trends
        const trendsData = await this.client.getTrendsData(keyword);
        result.fetched++;

        // Store interest over time data
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get most recent data point for today
        const latestPoint = trendsData.interestOverTime[trendsData.interestOverTime.length - 1];
        if (latestPoint) {
          await this.prisma.googleTrend.upsert({
            where: {
              keyword_date_region: {
                keyword: keyword.toLowerCase(),
                date: today,
                region: 'worldwide',
              },
            },
            update: {
              interestValue: latestPoint.value,
              isBreakout: trendsData.isBreakout,
              fetchedAt: new Date(),
            },
            create: {
              keyword: keyword.toLowerCase(),
              interestValue: latestPoint.value,
              isBreakout: trendsData.isBreakout,
              date: today,
              region: 'worldwide',
            },
          });
        }

        // Store related queries
        for (const related of trendsData.relatedQueries.slice(0, 10)) {
          await this.prisma.googleTrendRelatedQuery.upsert({
            where: {
              parentKeyword_relatedQuery_fetchedAt: {
                parentKeyword: keyword.toLowerCase(),
                relatedQuery: related.query.toLowerCase(),
                fetchedAt: today,
              },
            },
            update: {
              value: related.value,
              isBreakout: related.isBreakout,
              queryType: related.type,
            },
            create: {
              parentKeyword: keyword.toLowerCase(),
              relatedQuery: related.query.toLowerCase(),
              queryType: related.type,
              value: related.value,
              isBreakout: related.isBreakout,
              fetchedAt: today,
            },
          });
        }

        // Track breakouts
        if (trendsData.isBreakout) {
          result.breakouts.push(keyword);
        }

        // Update cache
        await this.setCachedTrends(keyword, trendsData);

        onProgress?.(i + 1, keywords.length, keyword);
      } catch (error) {
        console.error(`Error fetching trends for "${keyword}":`, error);
        result.errors++;
        onProgress?.(i + 1, keywords.length, keyword);
      }
    }

    return result;
  }

  /**
   * Get trends boost data for a keyword (used in demand calculation)
   */
  async getTrendsBoost(keyword: string): Promise<TrendsBoost | null> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trends = await this.prisma.googleTrend.findMany({
      where: {
        keyword: keyword.toLowerCase(),
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: 'desc' },
      take: 14, // Last 2 weeks for growth calculation
    });

    if (trends.length === 0) {
      return null;
    }

    const latestTrend = trends[0];
    const values = trends.map((t) => t.interestValue);

    // Calculate week-over-week growth
    let weekOverWeekGrowth = 0;
    if (values.length >= 7) {
      const lastWeekAvg = values.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
      const previousWeekAvg =
        values.length >= 14 ? values.slice(7, 14).reduce((a, b) => a + b, 0) / Math.min(7, values.length - 7) : lastWeekAvg;

      if (previousWeekAvg > 0) {
        weekOverWeekGrowth = ((lastWeekAvg - previousWeekAvg) / previousWeekAvg) * 100;
      }
    }

    return {
      interestScore: latestTrend.interestValue,
      weekOverWeekGrowth: Math.round(weekOverWeekGrowth * 10) / 10,
      isBreakout: trends.some((t) => t.isBreakout),
      fetchedAt: latestTrend.fetchedAt,
    };
  }

  /**
   * Get hot ingredients for a specific period
   */
  async getHotIngredients(period: 'today' | 'week' | 'month', limit: number = 10): Promise<HotIngredient[]> {
    const dateRange = {
      today: 1,
      week: 7,
      month: 30,
    }[period];

    const since = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(Date.now() - dateRange * 2 * 24 * 60 * 60 * 1000);

    // Get current period data
    const currentTrends = await this.prisma.googleTrend.groupBy({
      by: ['keyword'],
      where: { date: { gte: since } },
      _avg: { interestValue: true },
      orderBy: { _avg: { interestValue: 'desc' } },
      take: limit * 2, // Get extra to filter
    });

    if (currentTrends.length === 0) {
      return [];
    }

    // Get breakout status for each keyword (can't aggregate boolean in PostgreSQL)
    const breakoutKeywords = await this.prisma.googleTrend.findMany({
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
    const previousTrends = await this.prisma.googleTrend.groupBy({
      by: ['keyword'],
      where: {
        date: { gte: previousPeriodStart, lt: since },
        keyword: { in: currentTrends.map((t) => t.keyword) },
      },
      _avg: { interestValue: true },
    });

    const previousMap = new Map(previousTrends.map((t) => [t.keyword, t._avg.interestValue || 0]));

    const results: HotIngredient[] = [];

    for (let i = 0; i < currentTrends.length && results.length < limit; i++) {
      const trend = currentTrends[i];
      const currentAvg = trend._avg.interestValue || 0;
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

    return results;
  }

  /**
   * Discover new trending ingredients from related queries
   */
  async discoverTrendingIngredients(): Promise<string[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get rising queries from last fetch
    const risingQueries = await this.prisma.googleTrendRelatedQuery.findMany({
      where: {
        queryType: 'rising',
        fetchedAt: { gte: oneDayAgo },
      },
      orderBy: { value: 'desc' },
      take: 50,
    });

    // Filter to food-related queries (basic heuristic)
    const foodTerms = risingQueries
      .map((q) => q.relatedQuery)
      .filter((query) => {
        // Simple filter: must be 1-3 words, not too long
        const words = query.split(' ');
        return words.length >= 1 && words.length <= 3 && query.length < 30;
      });

    return [...new Set(foodTerms)];
  }

  /**
   * Check cache for trends data
   */
  private async getCachedTrends(keyword: string): Promise<any | null> {
    const cacheKey = `trends:${keyword.toLowerCase()}`;

    const cached = await this.prisma.googleTrendsCache.findUnique({
      where: { cacheKey },
    });

    if (cached && cached.expiresAt > new Date()) {
      return JSON.parse(cached.responseData);
    }

    // Clean up expired cache
    if (cached) {
      await this.prisma.googleTrendsCache.delete({ where: { cacheKey } });
    }

    return null;
  }

  /**
   * Store trends data in cache
   */
  private async setCachedTrends(keyword: string, data: any): Promise<void> {
    const cacheKey = `trends:${keyword.toLowerCase()}`;

    await this.prisma.googleTrendsCache.upsert({
      where: { cacheKey },
      update: {
        responseData: JSON.stringify(data),
        expiresAt: new Date(Date.now() + this.cacheTtlMs),
      },
      create: {
        cacheKey,
        responseData: JSON.stringify(data),
        expiresAt: new Date(Date.now() + this.cacheTtlMs),
      },
    });
  }
}

/**
 * Standalone helper function to get trends boost for ingredients.
 * Combines trends data from multiple ingredients and returns the aggregate boost.
 */
export async function getTrendsBoost(
  prisma: PrismaClient,
  ingredients: string[]
): Promise<TrendsBoost | null> {
  if (ingredients.length === 0) {
    return null;
  }

  const fetcher = new GoogleTrendsFetcher(prisma);

  // Get trends boost for each ingredient
  const boosts = await Promise.all(
    ingredients.map((ing) => fetcher.getTrendsBoost(ing))
  );

  // Filter out nulls
  const validBoosts = boosts.filter((b): b is TrendsBoost => b !== null);

  if (validBoosts.length === 0) {
    return null;
  }

  // Aggregate: use highest interest score, average growth, any breakout
  const aggregatedBoost: TrendsBoost = {
    interestScore: Math.max(...validBoosts.map((b) => b.interestScore)),
    weekOverWeekGrowth:
      validBoosts.reduce((sum, b) => sum + b.weekOverWeekGrowth, 0) / validBoosts.length,
    isBreakout: validBoosts.some((b) => b.isBreakout),
    fetchedAt: validBoosts.reduce(
      (latest, b) => (b.fetchedAt > latest ? b.fetchedAt : latest),
      validBoosts[0].fetchedAt
    ),
  };

  return aggregatedBoost;
}
