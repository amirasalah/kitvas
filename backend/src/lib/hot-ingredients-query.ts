/**
 * Hot Ingredients Query
 *
 * Shared query logic for fetching hot ingredients from Google Trends data.
 * Used by both the analytics tRPC endpoint and the SSE broadcast trigger.
 */

import type { PrismaClient } from '@prisma/client';

export interface HotIngredientsResult {
  period: string;
  source: 'google_trends' | 'internal';
  ingredients: Array<{
    name: string;
    interest: number;
    growth: number;
    isBreakout: boolean;
    rank: number;
  }>;
  hasGoogleTrends: boolean;
}

export async function queryHotIngredients(
  prisma: PrismaClient,
  period: 'today' | 'week' | 'month',
  limit: number
): Promise<HotIngredientsResult> {
  const dateRange = {
    today: 2,
    week: 7,
    month: 30,
  }[period];

  const since = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(Date.now() - dateRange * 2 * 24 * 60 * 60 * 1000);

  const currentTrends = await prisma.googleTrend.groupBy({
    by: ['keyword'],
    where: { date: { gte: since } },
    _avg: { interestValue: true },
    orderBy: { _avg: { interestValue: 'desc' } },
    take: limit * 2,
  });

  if (currentTrends.length === 0) {
    return {
      period,
      source: 'internal' as const,
      ingredients: [],
      hasGoogleTrends: false,
    };
  }

  const breakoutKeywords = await prisma.googleTrend.findMany({
    where: {
      keyword: { in: currentTrends.map((t) => t.keyword) },
      date: { gte: since },
      isBreakout: true,
    },
    select: { keyword: true },
    distinct: ['keyword'],
  });
  const breakoutSet = new Set(breakoutKeywords.map((b) => b.keyword));

  const previousTrends = await prisma.googleTrend.groupBy({
    by: ['keyword'],
    where: {
      date: { gte: previousPeriodStart, lt: since },
      keyword: { in: currentTrends.map((t) => t.keyword) },
    },
    _avg: { interestValue: true },
  });

  const previousMap = new Map(previousTrends.map((t) => [t.keyword, t._avg.interestValue || 0]));

  const results = [];

  for (const trend of currentTrends) {
    if (results.length >= limit) break;

    const currentAvg = trend._avg.interestValue || 0;
    if (currentAvg < 10) continue;

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
}
