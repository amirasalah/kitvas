/**
 * Google Trends Types
 */

export interface TrendsInterestPoint {
  date: Date;
  value: number;
  keyword: string;
}

export interface RelatedQuery {
  query: string;
  type: 'rising' | 'top';
  value: number; // For top: 0-100, for rising: growth percentage
  isBreakout: boolean;
}

export interface TrendsResult {
  keyword: string;
  interestOverTime: TrendsInterestPoint[];
  relatedQueries: RelatedQuery[];
  averageInterest: number;
  latestInterest: number;
  weekOverWeekGrowth: number;
  isBreakout: boolean;
}

export interface TrendsBoost {
  interestScore: number; // 0-100
  weekOverWeekGrowth: number; // percentage
  isBreakout: boolean;
  fetchedAt: Date;
  correlation?: number; // correlation with internal trends
}

export interface FetchResult {
  fetched: number;
  cached: number;
  errors: number;
  breakouts: string[];
}

export interface HotIngredient {
  name: string;
  interest: number; // 0-100
  growth: number; // percentage
  isBreakout: boolean;
  rank: number;
}
