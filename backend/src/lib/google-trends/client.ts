/**
 * Google Trends Client
 *
 * Wraps the google-trends-api package with rate limiting and error handling.
 * Provides methods to fetch interest over time and related queries.
 */

import googleTrends from 'google-trends-api';
import { TrendsRateLimiter, getGlobalRateLimiter } from './rate-limiter.js';
import type { TrendsInterestPoint, RelatedQuery, TrendsResult } from './types.js';

export class GoogleTrendsClient {
  private rateLimiter: TrendsRateLimiter;
  private geo: string;

  constructor(options?: { rateLimiter?: TrendsRateLimiter; geo?: string }) {
    this.rateLimiter = options?.rateLimiter || getGlobalRateLimiter();
    this.geo = options?.geo || ''; // Empty string = worldwide
  }

  /**
   * Fetch interest over time for a keyword
   * Returns daily data points for the specified timeframe
   */
  async getInterestOverTime(
    keyword: string,
    options?: { startTime?: Date; endTime?: Date }
  ): Promise<TrendsInterestPoint[]> {
    await this.rateLimiter.waitForToken();

    const startTime = options?.startTime || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
    const endTime = options?.endTime || new Date();

    try {
      const response = await googleTrends.interestOverTime({
        keyword,
        startTime,
        endTime,
        geo: this.geo,
      });

      const data = JSON.parse(response);
      this.rateLimiter.reportSuccess();

      if (!data.default?.timelineData) {
        return [];
      }

      return data.default.timelineData.map((point: any) => ({
        date: new Date(point.time * 1000),
        value: point.value[0] || 0,
        keyword,
      }));
    } catch (error) {
      this.rateLimiter.reportError();
      throw error;
    }
  }

  /**
   * Fetch related queries for a keyword
   * Returns both 'top' (most popular) and 'rising' (fastest growing) queries
   */
  async getRelatedQueries(keyword: string): Promise<RelatedQuery[]> {
    await this.rateLimiter.waitForToken();

    try {
      const response = await googleTrends.relatedQueries({
        keyword,
        geo: this.geo,
      });

      const data = JSON.parse(response);
      this.rateLimiter.reportSuccess();

      const results: RelatedQuery[] = [];

      // Top queries
      const topQueries = data.default?.rankedList?.[0]?.rankedKeyword || [];
      for (const q of topQueries) {
        results.push({
          query: q.query,
          type: 'top',
          value: q.value,
          isBreakout: false,
        });
      }

      // Rising queries
      const risingQueries = data.default?.rankedList?.[1]?.rankedKeyword || [];
      for (const q of risingQueries) {
        // Google marks breakout trends with "Breakout" text instead of a number
        const isBreakout = q.formattedValue === 'Breakout';
        results.push({
          query: q.query,
          type: 'rising',
          value: isBreakout ? 5000 : q.value, // Breakout means >5000% growth
          isBreakout,
        });
      }

      return results;
    } catch (error) {
      this.rateLimiter.reportError();
      throw error;
    }
  }

  /**
   * Get comprehensive trends data for a keyword
   * Includes interest over time, related queries, and calculated metrics
   */
  async getTrendsData(keyword: string): Promise<TrendsResult> {
    const [interestOverTime, relatedQueries] = await Promise.all([
      this.getInterestOverTime(keyword),
      this.getRelatedQueries(keyword).catch(() => []), // Don't fail if related queries fail
    ]);

    // Calculate metrics
    const values = interestOverTime.map((p) => p.value);
    const averageInterest = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const latestInterest = values[values.length - 1] || 0;

    // Week-over-week growth
    let weekOverWeekGrowth = 0;
    if (values.length >= 14) {
      const lastWeek = values.slice(-7);
      const previousWeek = values.slice(-14, -7);
      const lastWeekAvg = lastWeek.reduce((a, b) => a + b, 0) / lastWeek.length;
      const previousWeekAvg = previousWeek.reduce((a, b) => a + b, 0) / previousWeek.length;
      if (previousWeekAvg > 0) {
        weekOverWeekGrowth = ((lastWeekAvg - previousWeekAvg) / previousWeekAvg) * 100;
      }
    }

    // Check if any rising queries indicate breakout
    const isBreakout = relatedQueries.some(
      (q) => q.type === 'rising' && q.isBreakout && q.query.toLowerCase().includes(keyword.toLowerCase())
    );

    return {
      keyword,
      interestOverTime,
      relatedQueries,
      averageInterest: Math.round(averageInterest),
      latestInterest,
      weekOverWeekGrowth: Math.round(weekOverWeekGrowth * 10) / 10,
      isBreakout,
    };
  }

  /**
   * Batch fetch trends for multiple keywords
   * Handles rate limiting automatically
   */
  async batchGetTrendsData(
    keywords: string[],
    onProgress?: (completed: number, total: number, keyword: string) => void
  ): Promise<Map<string, TrendsResult>> {
    const results = new Map<string, TrendsResult>();

    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      try {
        const data = await this.getTrendsData(keyword);
        results.set(keyword, data);
        onProgress?.(i + 1, keywords.length, keyword);
      } catch (error) {
        console.error(`Failed to fetch trends for "${keyword}":`, error);
        // Continue with other keywords
        onProgress?.(i + 1, keywords.length, keyword);
      }
    }

    return results;
  }
}

// Default client instance
let defaultClient: GoogleTrendsClient | null = null;

export function getDefaultClient(): GoogleTrendsClient {
  if (!defaultClient) {
    defaultClient = new GoogleTrendsClient();
  }
  return defaultClient;
}
