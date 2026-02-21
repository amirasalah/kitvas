import { z } from 'zod';
import { t } from '../trpc.js';

const PeriodSchema = z.enum(['1h', '24h', '7d', '30d']).default('24h');

function periodToMs(period: string): number {
  switch (period) {
    case '1h': return 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

export const dashboardRouter = t.router({
  // Cross-platform trending overview
  overview: t.procedure
    .input(z.object({ period: PeriodSchema }))
    .query(async ({ input, ctx }) => {
      const topics = await ctx.prisma.trendingTopic.findMany({
        where: { period: input.period },
        orderBy: { trendScore: 'desc' },
        take: 20,
      });

      const sources = await ctx.prisma.platformSource.findMany();

      return { topics, sources };
    }),

  // Top trending topics with source breakdown
  topTopics: t.procedure
    .input(z.object({
      period: PeriodSchema,
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.trendingTopic.findMany({
        where: { period: input.period },
        orderBy: { trendScore: 'desc' },
        take: input.limit,
      });
    }),

  // YouTube trending food videos
  youtubeTrending: t.procedure
    .input(z.object({ period: PeriodSchema }))
    .query(async ({ input, ctx }) => {
      const since = new Date(Date.now() - periodToMs(input.period));

      const videos = await ctx.prisma.video.findMany({
        where: {
          publishedAt: { gte: since },
          views: { not: null },
        },
        include: {
          videoIngredients: {
            where: { confidence: { gte: 0.5 } },
            include: { ingredient: true },
          },
          videoTags: true,
        },
        orderBy: { views: 'desc' },
        take: 20,
      });

      return videos.map(v => ({
        id: v.id,
        youtubeId: v.youtubeId,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        publishedAt: v.publishedAt,
        views: v.views,
        channelId: v.channelId,
        ingredients: v.videoIngredients.map(vi => vi.ingredient.name),
        tags: v.videoTags.map(vt => ({ tag: vt.tag, category: vt.category })),
      }));
    }),

  // Hot Reddit food posts
  redditHot: t.procedure
    .input(z.object({
      period: PeriodSchema,
      subreddit: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const since = new Date(Date.now() - periodToMs(input.period));

      return ctx.prisma.redditPost.findMany({
        where: {
          createdUtc: { gte: since },
          ...(input.subreddit ? { subreddit: input.subreddit } : {}),
        },
        orderBy: { score: 'desc' },
        take: 20,
      });
    }),

  // Trending food tweets
  twitterTrending: t.procedure
    .input(z.object({ period: PeriodSchema }))
    .query(async ({ input, ctx }) => {
      const since = new Date(Date.now() - periodToMs(input.period));

      return ctx.prisma.tweet.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { likeCount: 'desc' },
        take: 20,
      });
    }),

  // Latest food website articles
  webLatest: t.procedure
    .input(z.object({
      period: PeriodSchema,
      source: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const since = new Date(Date.now() - periodToMs(input.period));

      return ctx.prisma.webArticle.findMany({
        where: {
          publishedAt: { gte: since },
          ...(input.source ? { source: input.source } : {}),
        },
        orderBy: { publishedAt: 'desc' },
        take: 20,
      });
    }),

  // Platform source health status
  sourceStatus: t.procedure.query(async ({ ctx }) => {
    return ctx.prisma.platformSource.findMany();
  }),
});
