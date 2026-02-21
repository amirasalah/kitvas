/**
 * Cross-Platform Trend Aggregation
 *
 * Aggregates trending food topics from all sources (YouTube, Reddit, X, Web)
 * into the TrendingTopic model for the dashboard overview.
 *
 * Scoring formula:
 * - YouTube views weight: 0.40
 * - Reddit score weight: 0.25
 * - X engagement weight: 0.20
 * - Web articles weight: 0.15
 *
 * Schedule: Hourly at :45
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config({ path: '.env' });

const prisma = new PrismaClient();

const PERIODS = ['1h', '24h', '7d', '30d'] as const;

function periodToMs(period: string): number {
  switch (period) {
    case '1h': return 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

interface TopicCounts {
  youtubeCount: number;
  youtubeViews: number;
  redditCount: number;
  redditScore: number;
  twitterCount: number;
  twitterEngagement: number;
  webCount: number;
}

async function aggregateTrendingTopics() {
  console.log('[Aggregate] Starting cross-platform trend aggregation...');
  const startTime = Date.now();

  for (const period of PERIODS) {
    const since = new Date(Date.now() - periodToMs(period));
    console.log(`[Aggregate] Processing period: ${period} (since ${since.toISOString()})`);

    // Collect ingredient mentions from all sources
    const topicMap = new Map<string, TopicCounts>();

    function getOrCreate(topic: string): TopicCounts {
      const normalized = topic.toLowerCase().trim();
      if (!topicMap.has(normalized)) {
        topicMap.set(normalized, {
          youtubeCount: 0, youtubeViews: 0,
          redditCount: 0, redditScore: 0,
          twitterCount: 0, twitterEngagement: 0,
          webCount: 0,
        });
      }
      return topicMap.get(normalized)!;
    }

    // 1. YouTube: Count ingredient mentions in recent videos
    const recentVideos = await prisma.video.findMany({
      where: {
        publishedAt: { gte: since },
        views: { not: null },
      },
      include: {
        videoIngredients: {
          where: { confidence: { gte: 0.5 } },
          include: { ingredient: true },
        },
      },
    });

    for (const video of recentVideos) {
      for (const vi of video.videoIngredients) {
        const counts = getOrCreate(vi.ingredient.name);
        counts.youtubeCount++;
        counts.youtubeViews += video.views || 0;
      }
    }

    // 2. Reddit: Count ingredient mentions in recent posts
    const recentReddit = await prisma.redditPost.findMany({
      where: { createdUtc: { gte: since } },
    });

    for (const post of recentReddit) {
      for (const ingredient of post.ingredients) {
        const counts = getOrCreate(ingredient);
        counts.redditCount++;
        counts.redditScore += post.score;
      }
    }

    // 3. X/Twitter: Count ingredient mentions in recent tweets
    const recentTweets = await prisma.tweet.findMany({
      where: { createdAt: { gte: since } },
    });

    for (const tweet of recentTweets) {
      for (const ingredient of tweet.ingredients) {
        const counts = getOrCreate(ingredient);
        counts.twitterCount++;
        counts.twitterEngagement += tweet.likeCount + tweet.retweetCount;
      }
    }

    // 4. Web: Count ingredient mentions in recent articles
    const recentArticles = await prisma.webArticle.findMany({
      where: { publishedAt: { gte: since } },
    });

    for (const article of recentArticles) {
      for (const ingredient of article.ingredients) {
        const counts = getOrCreate(ingredient);
        counts.webCount++;
      }
    }

    // Calculate trend scores and upsert
    const maxYtViews = Math.max(...Array.from(topicMap.values()).map(c => c.youtubeViews), 1);
    const maxRedditScore = Math.max(...Array.from(topicMap.values()).map(c => c.redditScore), 1);
    const maxTwitterEng = Math.max(...Array.from(topicMap.values()).map(c => c.twitterEngagement), 1);
    const maxWebCount = Math.max(...Array.from(topicMap.values()).map(c => c.webCount), 1);

    let upsertCount = 0;

    for (const [topic, counts] of topicMap.entries()) {
      const mentionCount = counts.youtubeCount + counts.redditCount + counts.twitterCount + counts.webCount;
      if (mentionCount < 2) continue; // Skip topics with very few mentions

      // Normalized weighted score (0-100)
      const ytScore = (counts.youtubeViews / maxYtViews) * 100 * 0.40;
      const redditScoreNorm = (counts.redditScore / maxRedditScore) * 100 * 0.25;
      const twitterScoreNorm = (counts.twitterEngagement / maxTwitterEng) * 100 * 0.20;
      const webScoreNorm = (counts.webCount / maxWebCount) * 100 * 0.15;
      const trendScore = Math.min(100, ytScore + redditScoreNorm + twitterScoreNorm + webScoreNorm);

      // Determine active sources
      const sources: string[] = [];
      if (counts.youtubeCount > 0) sources.push('youtube');
      if (counts.redditCount > 0) sources.push('reddit');
      if (counts.twitterCount > 0) sources.push('x');
      if (counts.webCount > 0) sources.push('web');

      // Breakout: appears on 3+ platforms or very high score
      const isBreakout = sources.length >= 3 || trendScore > 80;

      try {
        // Calculate growth by comparing to previous period
        const prevPeriodStart = new Date(since.getTime() - periodToMs(period));
        const previousTopic = await prisma.trendingTopic.findUnique({
          where: { topic_period: { topic, period } },
          select: { trendScore: true },
        });

        const growthPct = previousTopic
          ? ((trendScore - previousTopic.trendScore) / (previousTopic.trendScore || 1)) * 100
          : null;

        await prisma.trendingTopic.upsert({
          where: { topic_period: { topic, period } },
          update: {
            trendScore,
            sources,
            mentionCount,
            youtubeCount: counts.youtubeCount,
            redditCount: counts.redditCount,
            twitterCount: counts.twitterCount,
            webCount: counts.webCount,
            growthPct,
            isBreakout,
          },
          create: {
            topic,
            period,
            trendScore,
            sources,
            mentionCount,
            youtubeCount: counts.youtubeCount,
            redditCount: counts.redditCount,
            twitterCount: counts.twitterCount,
            webCount: counts.webCount,
            growthPct,
            isBreakout,
          },
        });
        upsertCount++;
      } catch (error) {
        console.error(`[Aggregate] Error upserting topic "${topic}":`, error);
      }
    }

    console.log(`[Aggregate] Period ${period}: ${upsertCount} topics aggregated from ${topicMap.size} unique ingredients`);
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log(`[Aggregate] Done in ${duration}s`);
}

aggregateTrendingTopics()
  .catch(err => {
    console.error('[Aggregate] Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
