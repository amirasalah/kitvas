import { z } from 'zod';
import { TRPCError, initTRPC } from '@trpc/server';
import type { Context } from '../context.js';
import { getCachedSearch, setCachedSearch } from '../lib/search-cache.js';
import { checkRateLimit, incrementRateLimit, getRemainingSearches } from '../lib/rate-limiter.js';
import { queueForExtraction } from '../lib/extraction-queue.js';
import { searchYouTubeVideos, getVideoDetails, type YouTubeVideo } from '../lib/youtube.js';
import { calculateYouTubeDemandSignal } from '../lib/youtube-demand-calculator.js';

const t = initTRPC.context<Context>().create();

const SearchInputSchema = z.object({
  ingredients: z.array(z.string()).min(1).max(10),
  tags: z.array(z.string()).optional(),
});

/**
 * Search YouTube for videos matching ingredients
 * Returns video details with view counts
 */
async function searchYouTubeLive(
  ingredients: string[],
  maxResults: number = 20
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('[Search] No YOUTUBE_API_KEY configured, skipping live search');
    return [];
  }

  try {
    // Build search query from ingredients
    const query = `${ingredients.join(' ')} recipe`;

    // Search YouTube
    const searchResults = await searchYouTubeVideos(query, apiKey, maxResults);

    if (searchResults.length === 0) {
      return [];
    }

    // Get video details (includes view counts)
    const videoIds = searchResults.map(r => r.id.videoId);
    const videoDetails = await getVideoDetails(videoIds, apiKey);

    return videoDetails;
  } catch (error) {
    console.error('[Search] YouTube API error:', error);
    return [];
  }
}

export const searchRouter = t.router({
  search: t.procedure
    .input(SearchInputSchema)
    .query(async ({ input, ctx }) => {
      const { ingredients } = input;

      try {
        // Normalize ingredient names (lowercase, trim)
        const normalizedIngredients = ingredients.map((ing) =>
          ing.toLowerCase().trim()
        );

        // 1. Always search database (fast, has ingredient data)
        const videos = await ctx.prisma.video.findMany({
          where: {
            videoIngredients: {
              some: {
                ingredient: {
                  name: {
                    in: normalizedIngredients,
                  },
                },
              },
            },
          },
          include: {
            videoIngredients: {
              include: {
                ingredient: true,
              },
            },
          },
          take: 50,
          orderBy: {
            publishedAt: 'desc',
          },
        });

        // Calculate relevance scores for database results
        const analyzedVideos = videos.map((video) => {
          const matchingIngredients = video.videoIngredients.filter((vi) =>
            normalizedIngredients.includes(vi.ingredient.name)
          );
          const relevanceScore = matchingIngredients.length / normalizedIngredients.length;

          return {
            id: video.id,
            youtubeId: video.youtubeId,
            title: video.title,
            description: video.description,
            thumbnailUrl: video.thumbnailUrl,
            publishedAt: video.publishedAt,
            views: video.views,
            relevanceScore,
            ingredients: video.videoIngredients.map((vi) => ({
              id: vi.ingredient.id,
              name: vi.ingredient.name,
              confidence: vi.confidence,
              source: vi.source,
            })),
          };
        });

        // Sort by relevance score
        analyzedVideos.sort((a, b) => b.relevanceScore - a.relevanceScore);

        // 2. Check cache for YouTube results
        let youtubeVideos = getCachedSearch(normalizedIngredients);
        let rateLimitRemaining = getRemainingSearches(ctx.userId || null, ctx.clientIp);

        // 3. If no cache and within rate limit, call YouTube API
        if (!youtubeVideos && checkRateLimit(ctx.userId || null, ctx.clientIp)) {
          youtubeVideos = await searchYouTubeLive(normalizedIngredients);

          if (youtubeVideos.length > 0) {
            setCachedSearch(normalizedIngredients, youtubeVideos);
            incrementRateLimit(ctx.userId || null, ctx.clientIp);
            rateLimitRemaining = getRemainingSearches(ctx.userId || null, ctx.clientIp);

            // 4. Queue new videos for background extraction
            const dbYoutubeIds = new Set(videos.map(v => v.youtubeId));
            const newVideos = youtubeVideos.filter(v => !dbYoutubeIds.has(v.id));

            if (newVideos.length > 0) {
              queueForExtraction(newVideos, ctx.prisma).catch(err =>
                console.error('[Search] Failed to queue videos:', err)
              );
            }
          }
        }

        // Filter YouTube results to exclude videos already in database
        const dbYoutubeIds = new Set(videos.map(v => v.youtubeId));
        const freshYoutubeVideos = (youtubeVideos || [])
          .filter(v => !dbYoutubeIds.has(v.id))
          .map(v => ({
            youtubeId: v.id,
            title: v.snippet.title,
            description: v.snippet.description,
            thumbnailUrl: v.snippet.thumbnails.high?.url || v.snippet.thumbnails.medium?.url || v.snippet.thumbnails.default.url,
            publishedAt: v.snippet.publishedAt,
            views: v.statistics?.viewCount ? parseInt(v.statistics.viewCount, 10) : null,
          }));

        // Log search pattern (moat contribution)
        try {
          await ctx.prisma.search.create({
            data: {
              ingredients: normalizedIngredients,
              userId: ctx.userId || null,
            },
          });
        } catch (error) {
          console.error('Failed to log search:', error);
        }

        // Calculate demand signals from YouTube data (zero extra API calls)
        // Pass ingredients to filter videos by relevance
        const demandSignal = calculateYouTubeDemandSignal(youtubeVideos || [], normalizedIngredients);

        return {
          // Analyzed videos from database (with ingredient data)
          analyzedVideos,
          // Fresh videos from YouTube (no ingredients yet)
          youtubeVideos: freshYoutubeVideos,
          // Rate limit info
          rateLimitRemaining,
          // Legacy field for backward compatibility
          videos: analyzedVideos,
          // YouTube market-based demand signals
          demand: demandSignal.demandBand,
          demandSignal: {
            demandScore: demandSignal.demandScore,
            avgViews: demandSignal.marketMetrics.avgViews,
            medianViews: demandSignal.marketMetrics.medianViews,
            avgViewsPerDay: demandSignal.marketMetrics.avgViewsPerDay,
            videoCount: demandSignal.marketMetrics.videoCount,
            contentGap: demandSignal.contentGap,
            confidence: demandSignal.confidence,
          },
          opportunities: demandSignal.opportunities,
        };
      } catch (error) {
        console.error('Search error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to perform search',
        });
      }
    }),
});
