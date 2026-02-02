// Type declarations for modules used by backend (imported via @kitvas/backend alias)
declare module 'google-trends-api' {
  export interface InterestOverTimeOptions {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
    timezone?: number;
    category?: number;
    property?: string;
    resolution?: string;
    granularTimeResolution?: boolean;
  }

  export interface RelatedQueriesOptions {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
    timezone?: number;
    category?: number;
    property?: string;
  }

  export function interestOverTime(options: InterestOverTimeOptions): Promise<string>;
  export function relatedQueries(options: RelatedQueriesOptions): Promise<string>;
  export function relatedTopics(options: RelatedQueriesOptions): Promise<string>;
  export function interestByRegion(options: InterestOverTimeOptions): Promise<string>;
  export function dailyTrends(options: { geo: string; trendDate?: Date; hl?: string }): Promise<string>;
  export function realTimeTrends(options: { geo: string; hl?: string; category?: string }): Promise<string>;
}
