import { z } from 'zod';
import { TRPCError, initTRPC } from '@trpc/server';
import type { Context } from '../context.js';
import { getCachedSearch, setCachedSearch, getCacheKey } from '../lib/search-cache.js';
import { checkRateLimit, incrementRateLimit, getRemainingSearches } from '../lib/rate-limiter.js';
import { searchYouTubeVideos, getVideoDetails, type YouTubeVideo } from '../lib/youtube.js';
import { calculateYouTubeDemandSignal } from '../lib/youtube-demand-calculator.js';
import { extractIngredientsFromVideo, storeExtractedIngredients } from '../lib/ingredient-extractor.js';
import { extractTagsFromVideo, storeExtractedTags } from '../lib/tag-extractor.js';
import { processBackgroundVideos } from '../lib/background-processor.js';
import { fetchTranscript } from '../lib/transcript-fetcher.js';
import { getTrendsBoost } from '../lib/google-trends/fetcher.js';

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
  maxResults: number = 50
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

        // Filter videos with tiered relevance fallback
        // Priority: 100% matches > partial matches (if not enough exact) > any matches
        let filteredVideos = [] as typeof analyzedVideosUnfiltered;
        let lowRelevanceFallback = false;

        // First: Get videos with 100% ingredient match (all searched ingredients present)
        const exactMatches = analyzedVideosUnfiltered.filter(
          (video) => video.relevanceScore === 1.0
        );

        if (exactMatches.length >= 3 || normalizedIngredients.length === 1) {
          // Enough exact matches OR single ingredient search - use only exact matches
          filteredVideos = exactMatches;
        } else if (exactMatches.length > 0) {
          // Some exact matches but not enough - prioritize them, add partial matches
          const partialMatches = analyzedVideosUnfiltered.filter(
            (video) => video.relevanceScore >= 0.5 && video.relevanceScore < 1.0
          );
          filteredVideos = [...exactMatches, ...partialMatches];
        } else {
          // No exact matches - fall back to partial matches (50%+ relevance)
          const partialMatches = analyzedVideosUnfiltered.filter(
            (video) => video.relevanceScore >= 0.5
          );

          if (partialMatches.length > 0) {
            filteredVideos = partialMatches;
            lowRelevanceFallback = true;
          } else if (analyzedVideosUnfiltered.length > 0) {
            // Last resort: Show any matches but limit to top 6
            filteredVideos = analyzedVideosUnfiltered.slice(0, 6);
            lowRelevanceFallback = true;
          }
        }

        // Remove internal matchingCount field and sort by relevance
        let analyzedVideos = filteredVideos
          .map(({ matchingCount, ...video }) => video)
          .sort((a, b) => b.relevanceScore - a.relevanceScore);

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

        for (const ytVideo of freshYoutubeVideosRaw.slice(0, 10)) {
          try {
            // Create video record in database
            const dbVideo = await ctx.prisma.video.upsert({
              where: { youtubeId: ytVideo.id },
              update: {},
              create: {
                youtubeId: ytVideo.id,
                title: ytVideo.snippet.title,
                description: ytVideo.snippet.description || null,
                thumbnailUrl: ytVideo.snippet.thumbnails.high?.url || ytVideo.snippet.thumbnails.medium?.url || ytVideo.snippet.thumbnails.default.url,
                publishedAt: new Date(ytVideo.snippet.publishedAt),
                views: ytVideo.statistics?.viewCount ? parseInt(ytVideo.statistics.viewCount, 10) : null,
                viewsUpdatedAt: new Date(),
                channelId: ytVideo.snippet.channelId || null,
                extractedAt: new Date(),
              },
            });

            // Try to fetch transcript for better ingredient detection
            let transcript: string | null = null;
            try {
              transcript = await fetchTranscript(ytVideo.id);
              if (transcript) {
                console.log(`[Search] Fetched transcript for ${ytVideo.id} (${transcript.length} chars)`);
              }
            } catch {
              // Transcript not available — continue without
            }

            // Extract ingredients using LLM/keywords (and transcript if available)
            const extractedIngredients = await extractIngredientsFromVideo(
              ytVideo.snippet.title,
              ytVideo.snippet.description || null,
              transcript
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

        // Filter fresh videos by relevance (must have at least one matching ingredient)
        // and by tag if tag filters are active
        let filteredFreshVideos = freshAnalyzedVideos.filter(
          video => video.relevanceScore > 0
        );

        if (normalizedTags.length > 0) {
          filteredFreshVideos = filteredFreshVideos.filter(video =>
            video.tags.some(t => normalizedTags.includes(t.tag))
          );
        }

        // Merge fresh analyzed videos with existing analyzed videos
        const allAnalyzedVideos = [...filteredFreshVideos, ...analyzedVideos];

        // Sort all by relevance score
        allAnalyzedVideos.sort((a, b) => b.relevanceScore - a.relevanceScore);

        // Process remaining fresh videos in background (fire-and-forget)
        const remainingVideos = freshYoutubeVideosRaw.slice(10);
        if (remainingVideos.length > 0) {
          processBackgroundVideos(ctx.prisma, remainingVideos).catch((err: unknown) =>
            console.error('[Search] Background video processing error:', err)
          );
        }

        // Fetch Google Trends boost for enhanced demand scoring
        const trendsBoost = await getTrendsBoost(ctx.prisma, normalizedIngredients);

        // Calculate demand signals from YouTube data (zero extra API calls)
        // Pass ingredients to filter videos by relevance, with optional Google Trends boost
        const demandSignal = calculateYouTubeDemandSignal(youtubeVideos || [], normalizedIngredients, trendsBoost || undefined);
        const hadYouTubeHit = youtubeVideos !== null && youtubeVideos.length > 0;

        // Persist demand signal to database for caching and historical tracking
        if (hadYouTubeHit && demandSignal.sampleSize > 0) {
          const ingredientKey = getCacheKey(normalizedIngredients);
          try {
            await ctx.prisma.demandSignal.upsert({
              where: { ingredientKey },
              update: {
                demandScore: demandSignal.demandScore,
                demandBand: demandSignal.demandBand,
                avgViews: demandSignal.marketMetrics.avgViews,
                medianViews: demandSignal.marketMetrics.medianViews,
                avgViewsPerDay: demandSignal.marketMetrics.avgViewsPerDay,
                videoCount: demandSignal.marketMetrics.videoCount,
                contentGapScore: demandSignal.contentGap.score,
                contentGapType: demandSignal.contentGap.type,
                confidence: demandSignal.confidence,
                sampleSize: demandSignal.sampleSize,
                calculatedAt: new Date(),
                // Google Trends data
                googleTrendsScore: demandSignal.trendsBoost?.interestScore ?? null,
                googleTrendsGrowth: demandSignal.trendsBoost?.weekOverWeekGrowth ?? null,
                googleTrendsBreakout: demandSignal.trendsBoost?.isBreakout ?? false,
                googleTrendsFetchedAt: demandSignal.trendsBoost ? new Date() : null,
              },
              create: {
                ingredientKey,
                ingredients: normalizedIngredients,
                demandScore: demandSignal.demandScore,
                demandBand: demandSignal.demandBand,
                avgViews: demandSignal.marketMetrics.avgViews,
                medianViews: demandSignal.marketMetrics.medianViews,
                avgViewsPerDay: demandSignal.marketMetrics.avgViewsPerDay,
                videoCount: demandSignal.marketMetrics.videoCount,
                contentGapScore: demandSignal.contentGap.score,
                contentGapType: demandSignal.contentGap.type,
                confidence: demandSignal.confidence,
                sampleSize: demandSignal.sampleSize,
                // Google Trends data
                googleTrendsScore: demandSignal.trendsBoost?.interestScore ?? null,
                googleTrendsGrowth: demandSignal.trendsBoost?.weekOverWeekGrowth ?? null,
                googleTrendsBreakout: demandSignal.trendsBoost?.isBreakout ?? false,
                googleTrendsFetchedAt: demandSignal.trendsBoost ? new Date() : null,
              },
            });
          } catch (error) {
            console.error('[Search] Failed to persist demand signal:', error);
          }
        }

        // Log search pattern (moat contribution)
        try {
          await ctx.prisma.search.create({
            data: {
              ingredients: normalizedIngredients,
              userId: ctx.userId || null,
              resultCount: allAnalyzedVideos.length,
              hadYouTubeHit,
              demandBand: demandSignal.demandBand,
            },
          });
        } catch (error) {
          console.error('Failed to log search:', error);
        }

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
