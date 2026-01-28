import { z } from 'zod';
import { TRPCError, initTRPC } from '@trpc/server';
import type { Context } from '../context.js';
import { getCachedSearch, setCachedSearch } from '../lib/search-cache.js';
import { checkRateLimit, incrementRateLimit, getRemainingSearches } from '../lib/rate-limiter.js';
import { searchYouTubeVideos, getVideoDetails, type YouTubeVideo } from '../lib/youtube.js';
import { calculateYouTubeDemandSignal } from '../lib/youtube-demand-calculator.js';
import { extractIngredientsFromVideo, storeExtractedIngredients } from '../lib/ingredient-extractor.js';
import { extractTagsFromVideo, storeExtractedTags } from '../lib/tag-extractor.js';

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
      const { ingredients, tags: filterTags } = input;

      try {
        // Normalize ingredient names (lowercase, trim)
        const normalizedIngredients = ingredients.map((ing) =>
          ing.toLowerCase().trim()
        );
        const normalizedTags = filterTags?.map((t) => t.toLowerCase().trim()) || [];

        // 1. Always search database (fast, has ingredient data)
        const videoWhere: any = {
          videoIngredients: {
            some: {
              ingredient: {
                name: {
                  in: normalizedIngredients,
                },
              },
            },
          },
        };

        // If tags are specified, filter by them
        if (normalizedTags.length > 0) {
          videoWhere.videoTags = {
            some: {
              tag: { in: normalizedTags },
            },
          };
        }

        const videos = await ctx.prisma.video.findMany({
          where: videoWhere,
          include: {
            videoIngredients: {
              include: {
                ingredient: true,
              },
            },
            videoTags: true,
          },
          take: 50,
          orderBy: {
            publishedAt: 'desc',
          },
        });

        // Calculate relevance scores for database results
        const analyzedVideosUnfiltered = videos.map((video) => {
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
            matchingCount: matchingIngredients.length,
            ingredients: video.videoIngredients.map((vi) => ({
              id: vi.ingredient.id,
              name: vi.ingredient.name,
              confidence: vi.confidence,
              source: vi.source,
            })),
            tags: video.videoTags.map((vt) => ({
              tag: vt.tag,
              category: vt.category,
            })),
          };
        });

        // Filter out low-relevance videos
        // Require at least 50% of searched ingredients OR at least 2 matching ingredients
        const minRelevanceThreshold = 0.5;
        const minMatchingIngredients = Math.min(2, normalizedIngredients.length);

        let analyzedVideos = analyzedVideosUnfiltered
          .filter((video) =>
            video.relevanceScore >= minRelevanceThreshold ||
            video.matchingCount >= minMatchingIngredients
          )
          .map(({ matchingCount, ...video }) => video);

        // Fallback: if strict filtering returns no results, show videos with at least 1 match
        // This ensures users still see ingredients and can provide corrections
        let lowRelevanceFallback = false;
        if (analyzedVideos.length === 0 && analyzedVideosUnfiltered.length > 0) {
          analyzedVideos = analyzedVideosUnfiltered
            .filter((video) => video.matchingCount >= 1)
            .map(({ matchingCount, ...video }) => video);
          lowRelevanceFallback = true;
        }

        // Sort by relevance score
        analyzedVideos.sort((a, b) => b.relevanceScore - a.relevanceScore);

        // Limit fallback results to top 6 to avoid too many low-relevance results
        if (lowRelevanceFallback) {
          analyzedVideos = analyzedVideos.slice(0, 6);
        }

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
          }
        }

        // Filter YouTube results to exclude videos already in database
        const dbYoutubeIds = new Set(videos.map(v => v.youtubeId));
        const freshYoutubeVideosRaw = (youtubeVideos || [])
          .filter(v => !dbYoutubeIds.has(v.id));

        // 4. Extract ingredients INLINE for fresh YouTube videos and store in database
        // This enables the correction system immediately for new videos
        const freshAnalyzedVideos: typeof analyzedVideos = [];

        for (const ytVideo of freshYoutubeVideosRaw.slice(0, 10)) { // Limit to 10 to avoid slow response
          try {
            // Create video record in database
            const dbVideo = await ctx.prisma.video.upsert({
              where: { youtubeId: ytVideo.id },
              update: {}, // Don't update if exists
              create: {
                youtubeId: ytVideo.id,
                title: ytVideo.snippet.title,
                description: ytVideo.snippet.description || null,
                thumbnailUrl: ytVideo.snippet.thumbnails.high?.url || ytVideo.snippet.thumbnails.medium?.url || ytVideo.snippet.thumbnails.default.url,
                publishedAt: new Date(ytVideo.snippet.publishedAt),
                views: ytVideo.statistics?.viewCount ? parseInt(ytVideo.statistics.viewCount, 10) : null,
                extractedAt: new Date(),
              },
            });

            // Extract ingredients using LLM/keywords
            const extractedIngredients = await extractIngredientsFromVideo(
              ytVideo.snippet.title,
              ytVideo.snippet.description || null
            );

            // Store ingredients in database (enables corrections)
            if (extractedIngredients.length > 0) {
              await storeExtractedIngredients(ctx.prisma, dbVideo.id, extractedIngredients);
            }

            // Extract and store tags (cooking method, dietary, cuisine) - Week 5
            try {
              const extractedTags = await extractTagsFromVideo(
                ytVideo.snippet.title,
                ytVideo.snippet.description || null
              );
              if (extractedTags.length > 0) {
                await storeExtractedTags(ctx.prisma, dbVideo.id, extractedTags);
              }
            } catch (tagError) {
              console.warn(`[Search] Tag extraction failed for ${ytVideo.id}:`, tagError);
            }

            // Calculate relevance score
            const matchingIngredients = extractedIngredients.filter(ing =>
              normalizedIngredients.includes(ing.name.toLowerCase())
            );
            const relevanceScore = normalizedIngredients.length > 0
              ? matchingIngredients.length / normalizedIngredients.length
              : 0;

            // Fetch the ingredient IDs and tags from database for correction system
            const videoWithDetails = await ctx.prisma.video.findUnique({
              where: { id: dbVideo.id },
              include: {
                videoIngredients: {
                  include: { ingredient: true },
                },
                videoTags: true,
              },
            });

            if (videoWithDetails) {
              freshAnalyzedVideos.push({
                id: videoWithDetails.id,
                youtubeId: videoWithDetails.youtubeId,
                title: videoWithDetails.title,
                description: videoWithDetails.description,
                thumbnailUrl: videoWithDetails.thumbnailUrl,
                publishedAt: videoWithDetails.publishedAt,
                views: videoWithDetails.views,
                relevanceScore,
                ingredients: videoWithDetails.videoIngredients.map(vi => ({
                  id: vi.ingredient.id,
                  name: vi.ingredient.name,
                  confidence: vi.confidence,
                  source: vi.source,
                })),
                tags: videoWithDetails.videoTags.map(vt => ({
                  tag: vt.tag,
                  category: vt.category,
                })),
              });
            }
          } catch (error) {
            console.error(`[Search] Failed to process fresh video ${ytVideo.id}:`, error);
            // Continue with other videos
          }
        }

        // Filter fresh videos by tag if tag filters are active
        const filteredFreshVideos = normalizedTags.length > 0
          ? freshAnalyzedVideos.filter(video =>
              video.tags.some(t => normalizedTags.includes(t.tag))
            )
          : freshAnalyzedVideos;

        // Merge fresh analyzed videos with existing analyzed videos
        const allAnalyzedVideos = [...filteredFreshVideos, ...analyzedVideos];

        // Sort all by relevance score
        allAnalyzedVideos.sort((a, b) => b.relevanceScore - a.relevanceScore);

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
          // All analyzed videos (database + freshly extracted from YouTube)
          analyzedVideos: allAnalyzedVideos,
          // Empty - all YouTube videos are now analyzed inline
          youtubeVideos: [] as Array<{
            youtubeId: string;
            title: string;
            description: string | null;
            thumbnailUrl: string;
            publishedAt: string;
            views: number | null;
          }>,
          // Rate limit info
          rateLimitRemaining,
          // Flag indicating low-relevance fallback was used
          lowRelevanceFallback,
          // Legacy field for backward compatibility
          videos: allAnalyzedVideos,
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
