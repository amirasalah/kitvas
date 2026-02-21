/**
 * Cron Job Configuration
 *
 * All scheduled jobs for Kitvas backend.
 * Times are in UTC timezone.
 *
 * Cron expression format: minute hour day-of-month month day-of-week
 * Examples:
 *   '0 1 * * *'   = Daily at 1:00 AM UTC
 *   '0 3 * * 0'   = Weekly on Sundays at 3:00 AM UTC
 *   '10 0 * * *'  = Daily at 12:10 AM UTC
 */

export interface ScheduledJob {
  name: string;
  description: string;
  schedule: string;
  script: string;
  enabled: boolean;
  timeout?: number; // milliseconds, default 30 minutes
}

export const scheduledJobs: ScheduledJob[] = [
  // ============================================
  // DAILY JOBS
  // ============================================

  {
    name: 'aggregate-trends',
    description: 'Aggregate search trends from the past 24 hours',
    schedule: '10 0 * * *', // Daily at 12:10 AM UTC
    script: 'src/scripts/aggregate-trends.ts',
    enabled: true,
    timeout: 10 * 60 * 1000, // 10 minutes
  },

  {
    name: 'trends-hourly',
    description: 'Fetch Google Trends data for top ingredients',
    schedule: '0 * * * *', // Every hour at :00
    script: 'src/scripts/fetch-google-trends.ts',
    enabled: true,
    timeout: 30 * 60 * 1000, // 30 minutes (rate-limited)
  },

  {
    name: 'batch-daily',
    description: 'Daily batch job for video processing and demand calculation',
    schedule: '0 2 * * *', // Daily at 2:00 AM UTC
    script: 'src/scripts/daily-batch-job.ts',
    enabled: true,
    timeout: 60 * 60 * 1000, // 60 minutes
  },

  // ============================================
  // WEEKLY JOBS
  // ============================================

  {
    name: 'refresh-views',
    description: 'Refresh video view counts from YouTube',
    schedule: '0 3 * * 0', // Weekly on Sundays at 3:00 AM UTC
    script: 'src/scripts/refresh-views.ts',
    enabled: true,
    timeout: 45 * 60 * 1000, // 45 minutes
  },

  {
    name: 'fetch-ingredients',
    description: 'Fetch new ingredients and synonyms from Wikidata',
    schedule: '0 6 * * 3', // Weekly on Wednesdays at 6:00 AM UTC
    script: 'src/scripts/fetch-wikidata-ingredients.ts',
    enabled: true,
    timeout: 15 * 60 * 1000, // 15 minutes
  },

  // ============================================
  // DASHBOARD DATA SOURCE JOBS
  // ============================================

  {
    name: 'youtube-trending',
    description: 'Fetch trending food videos from YouTube',
    schedule: '*/30 * * * *', // Every 30 minutes
    script: 'src/scripts/fetch-youtube-trending.ts',
    enabled: true,
    timeout: 15 * 60 * 1000, // 15 minutes
  },

  {
    name: 'rss-food-websites',
    description: 'Fetch articles from food publication RSS feeds',
    schedule: '0 * * * *', // Every hour
    script: 'src/scripts/fetch-food-websites.ts',
    enabled: true,
    timeout: 10 * 60 * 1000, // 10 minutes
  },

  {
    name: 'trend-aggregation',
    description: 'Aggregate trending topics across all platforms',
    schedule: '*/15 * * * *', // Every 15 minutes
    script: 'src/scripts/aggregate-trending-topics.ts',
    enabled: true,
    timeout: 10 * 60 * 1000, // 10 minutes
  },
];

/**
 * Get job by name
 */
export function getJob(name: string): ScheduledJob | undefined {
  return scheduledJobs.find((job) => job.name === name);
}

/**
 * Get all enabled jobs
 */
export function getEnabledJobs(): ScheduledJob[] {
  return scheduledJobs.filter((job) => job.enabled);
}

/**
 * Human-readable schedule description
 */
export function describeSchedule(schedule: string): string {
  const parts = schedule.split(' ');
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Hourly jobs
  if (hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Hourly at :${minute.padStart(2, '0')} UTC`;
  }

  // Daily jobs
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Daily at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')} UTC`;
  }

  // Weekly jobs
  if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[parseInt(dayOfWeek, 10)] || dayOfWeek;
    return `Weekly on ${dayName}s at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')} UTC`;
  }

  return schedule;
}
