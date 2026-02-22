import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { t } from '../trpc.js';
import { getCachedSearch, setCachedSearch, getCacheKey } from '../lib/search-cache.js';
import { checkRateLimit, incrementRateLimit, getRemainingSearches } from '../lib/rate-limiter.js';
import { searchYouTubeVideos, getVideoDetails, type YouTubeVideo } from '../lib/youtube.js';
import { calculateYouTubeDemandSignal } from '../lib/youtube-demand-calculator.js';
import { extractIngredientsFromVideo, storeExtractedIngredients } from '../lib/ingredient-extractor.js';
import { extractTagsFromVideo, storeExtractedTags } from '../lib/tag-extractor.js';
import { processBackgroundVideos } from '../lib/background-processor.js';
import { fetchTranscript } from '../lib/transcript-fetcher.js';
import { detectAndTranslate } from '../lib/translator.js';
import { getTrendsBoost } from '../lib/google-trends/fetcher.js';
import { normalizeIngredient, getSynonymMatches, getSynonyms } from '../lib/ingredient-synonyms.js';
import { logger } from '../lib/logger.js';

const SearchInputSchema = z.object({
  ingredients: z.array(z.string()).min(2).max(10),
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
    logger.warn('No YOUTUBE_API_KEY configured, skipping live search');
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
    logger.error('YouTube API error', { error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

/**
 * Check if a video title contains a search ingredient or any of its synonyms.
 * Supplements ingredient-based matching for dish names (kofte, falafel, etc.)
 * that are searchable but not extracted as VideoIngredient records.
 */
function titleContainsIngredient(titleLower: string, normalizedIngredient: string): boolean {
  if (titleLower.includes(normalizedIngredient)) {
    return true;
  }
  const synonyms = getSynonyms(normalizedIngredient);
  for (const syn of synonyms) {
    if (titleLower.includes(syn.toLowerCase())) {
      return true;
    }
  }
  return false;
}

export const searchRouter = t.router({
  // Autocomplete endpoint for ingredient suggestions
  autocomplete: t.procedure
    .input(z.object({ query: z.string().min(1).max(50) }))
    .query(async ({ input, ctx }) => {
      const { query } = input;
      const normalizedQuery = query.toLowerCase().trim();

      // Search database for matching ingredients by canonical name
      const dbIngredients = await ctx.prisma.ingredient.findMany({
        where: {
          name: {
            contains: normalizedQuery,
          },
        },
        take: 15,
        orderBy: {
          name: 'asc',
        },
        select: {
          name: true,
        },
      });

      // Search database for matching synonyms and return their canonical names
      const dbSynonyms = await ctx.prisma.ingredientSynonym.findMany({
        where: {
          synonym: {
            contains: normalizedQuery,
          },
        },
        take: 15,
        include: {
          ingredient: {
            select: {
              name: true,
            },
          },
        },
      });

      // Also search the static synonym map for aliases (fallback for ingredients not yet in DB)
      const synonymMatches = getSynonymMatches(normalizedQuery, 15);

      // Combine and dedupe results, prioritizing prefix matches
      const allMatches = new Set<string>();

      // First add prefix matches (from all sources)
      for (const ing of dbIngredients) {
        if (ing.name.startsWith(normalizedQuery)) {
          allMatches.add(ing.name);
        }
      }
      for (const syn of dbSynonyms) {
        if (syn.ingredient.name.startsWith(normalizedQuery) || syn.synonym.startsWith(normalizedQuery)) {
          allMatches.add(syn.ingredient.name);
        }
      }
      for (const name of synonymMatches) {
        if (name.startsWith(normalizedQuery)) {
          allMatches.add(name);
        }
      }

      // Then add contains matches
      for (const ing of dbIngredients) {
        allMatches.add(ing.name);
      }
      for (const syn of dbSynonyms) {
        allMatches.add(syn.ingredient.name);
      }
      for (const name of synonymMatches) {
        allMatches.add(name);
      }

      return Array.from(allMatches).slice(0, 10);
    }),

  search: t.procedure
    .input(SearchInputSchema)
    .query(async ({ input, ctx }) => {
      const { ingredients, tags: filterTags } = input;

      try {
        // Normalize ingredient names through synonym map (handles "soysauce" -> "soy sauce", etc.)
        const normalizedIngredients = ingredients.map((ing) =>
          normalizeIngredient(ing.toLowerCase().trim())
        );
        const normalizedTags = filterTags?.map((t) => t.toLowerCase().trim()) || [];

        // 1. Always search database (fast, has ingredient data)
        // Build title search terms: each ingredient + its synonyms (for dish names not extracted as ingredients)
        const titleSearchTerms: string[] = [];
        for (const ing of normalizedIngredients) {
          titleSearchTerms.push(ing);
          for (const syn of getSynonyms(ing)) {
            titleSearchTerms.push(syn.toLowerCase());
          }
        }

        const videoWhere: any = {
          OR: [
            // Match by ingredient records (existing behavior)
            {
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
            // Match by title text (catches dish names not extracted as ingredients)
            ...titleSearchTerms.slice(0, 20).map(term => ({
              title: {
                contains: term,
                mode: 'insensitive' as const,
              },
            })),
          ],
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
              where: { confidence: { gte: 0.5 } }, // Only include high-confidence ingredients
              include: {
                ingredient: true,
              },
            },
            videoTags: true,
          },
          take: 200, // Fetch larger pool for better relevance filtering
          orderBy: {
            views: 'desc', // Prioritize videos with view data over recency
          },
        });

        // Calculate relevance scores for database results
        // Binary match ratio for filtering/display + weighted score for ranking
        const analyzedVideosUnfiltered = videos.map((video) => {
          const titleLower = video.title.toLowerCase();

          // Count ingredient-based matches
          const matchingIngredients = video.videoIngredients.filter((vi) =>
            normalizedIngredients.includes(vi.ingredient.name)
          );
          const ingredientMatchedNames = new Set(matchingIngredients.map(vi => vi.ingredient.name));

          // Count title-based matches for unmatched search terms (catches dish names like kofte)
          const titleMatchedNames: string[] = [];
          for (const ing of normalizedIngredients) {
            if (!ingredientMatchedNames.has(ing) && titleContainsIngredient(titleLower, ing)) {
              titleMatchedNames.push(ing);
            }
          }

          const totalMatchCount = matchingIngredients.length + titleMatchedNames.length;
          // Binary match ratio (for filtering thresholds and "X% match" display)
          const relevanceScore = totalMatchCount / normalizedIngredients.length;

          // Weighted score for ranking (considers title presence + confidence)
          let weightedScore = 0;
          for (const ing of normalizedIngredients) {
            const matchedVi = video.videoIngredients.find(vi => vi.ingredient.name === ing);
            if (matchedVi) {
              if (titleLower.includes(ing)) {
                weightedScore += 1.0;   // In title AND extracted = highest signal
              } else if (matchedVi.confidence >= 0.8) {
                weightedScore += 0.85;  // High confidence match
              } else {
                weightedScore += 0.65;  // Lower confidence match
              }
            } else if (titleMatchedNames.includes(ing)) {
              weightedScore += 0.90;    // Title-only match (dish name not extracted)
            }
          }
          const sortScore = weightedScore / normalizedIngredients.length;

          return {
            id: video.id,
            youtubeId: video.youtubeId,
            title: video.title,
            description: video.description,
            thumbnailUrl: video.thumbnailUrl,
            publishedAt: video.publishedAt,
            views: video.views,
            relevanceScore,
            sortScore,
            matchingCount: totalMatchCount,
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

        // Minimum 50% match: at least half the searched ingredients must be in the video
        const filteredVideos = analyzedVideosUnfiltered.filter(
          (video) => video.relevanceScore >= 0.5
        );

        // Sort: relevance first, then views, then weighted score
        let analyzedVideos = filteredVideos
          .map(({ matchingCount, ...video }) => video)
          .sort((a, b) => {
            if (a.relevanceScore !== b.relevanceScore) return b.relevanceScore - a.relevanceScore;
            const aHasViews = a.views != null && a.views > 0 ? 1 : 0;
            const bHasViews = b.views != null && b.views > 0 ? 1 : 0;
            if (aHasViews !== bHasViews) return bHasViews - aHasViews;
            return b.sortScore - a.sortScore;
          });

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

        // 4. Extract ingredients for fresh YouTube videos in PARALLEL and store in database
        // Process up to 10 videos concurrently (5 at a time to respect Groq rate limits)
        const INLINE_LIMIT = 10;
        const CONCURRENCY = 5;

        async function processOneVideo(ytVideo: YouTubeVideo) {
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

          // Fetch transcript (network call)
          let transcript: string | null = null;
          let extractionTranscript: string | null = null;
          try {
            transcript = await fetchTranscript(ytVideo.id);
            if (transcript) {
              logger.debug(`Fetched transcript for ${ytVideo.id}`, { chars: transcript.length });
              const { translatedText, originalLanguage, wasTranslated } = await detectAndTranslate(transcript);
              extractionTranscript = wasTranslated ? translatedText : transcript;
              // Persist transcript + translation (fire-and-forget, don't block)
              ctx.prisma.video.update({
                where: { id: dbVideo.id },
                data: {
                  transcript,
                  transcriptLanguage: originalLanguage,
                  transcriptEnglish: wasTranslated ? translatedText : null,
                },
              }).catch(err => logger.error(`Failed to save transcript for ${ytVideo.id}`, { error: String(err) }));
            }
          } catch {
            // Transcript not available — continue without
          }

          // Run ingredient + tag extraction in PARALLEL (both are independent Groq calls)
          const [extractedIngredients, extractedTags] = await Promise.all([
            extractIngredientsFromVideo(
              ytVideo.snippet.title,
              ytVideo.snippet.description || null,
              extractionTranscript || transcript
            ),
            extractTagsFromVideo(
              ytVideo.snippet.title,
              ytVideo.snippet.description || null
            ).catch(err => {
              logger.warn(`Tag extraction failed for ${ytVideo.id}`, { error: err instanceof Error ? err.message : String(err) });
              return [] as Awaited<ReturnType<typeof extractTagsFromVideo>>;
            }),
          ]);

          // Store ingredients + tags in parallel
          await Promise.all([
            extractedIngredients.length > 0
              ? storeExtractedIngredients(ctx.prisma, dbVideo.id, extractedIngredients)
              : Promise.resolve(),
            extractedTags.length > 0
              ? storeExtractedTags(ctx.prisma, dbVideo.id, extractedTags)
              : Promise.resolve(),
          ]);

          // Build result directly from extracted data (no redundant DB refetch)
          const freshTitleLower = ytVideo.snippet.title.toLowerCase();
          const matchingIngs = extractedIngredients.filter(ing =>
            normalizedIngredients.includes(ing.name.toLowerCase())
          );
          const extractedMatchedNames = new Set(matchingIngs.map(ing => ing.name.toLowerCase()));
          const titleMatched: string[] = [];
          for (const ing of normalizedIngredients) {
            if (!extractedMatchedNames.has(ing) && titleContainsIngredient(freshTitleLower, ing)) {
              titleMatched.push(ing);
            }
          }

          const totalMatchCount = matchingIngs.length + titleMatched.length;
          const relevanceScore = normalizedIngredients.length > 0
            ? totalMatchCount / normalizedIngredients.length
            : 0;

          // Weighted score for ranking
          let weightedScore = 0;
          for (const ing of normalizedIngredients) {
            const matched = extractedIngredients.find(e => e.name.toLowerCase() === ing);
            if (matched) {
              if (freshTitleLower.includes(ing)) {
                weightedScore += 1.0;
              } else if (matched.confidence >= 0.8) {
                weightedScore += 0.85;
              } else {
                weightedScore += 0.65;
              }
            } else if (titleMatched.includes(ing)) {
              weightedScore += 0.90;
            }
          }
          const sortScore = weightedScore / normalizedIngredients.length;

          return {
            id: dbVideo.id,
            youtubeId: dbVideo.youtubeId,
            title: dbVideo.title,
            description: dbVideo.description,
            thumbnailUrl: dbVideo.thumbnailUrl,
            publishedAt: dbVideo.publishedAt,
            views: dbVideo.views,
            relevanceScore,
            sortScore,
            ingredients: extractedIngredients.map(ing => ({
              id: ing.name, // Use name as ID since we skip refetch
              name: ing.name,
              confidence: ing.confidence,
              source: ing.source,
            })),
            tags: extractedTags.map(t => ({
              tag: t.tag,
              category: t.category,
            })),
          };
        }

        // Process videos in batches with concurrency limit
        const inlineVideos = freshYoutubeVideosRaw.slice(0, INLINE_LIMIT);
        const freshAnalyzedVideos: typeof analyzedVideos = [];

        for (let i = 0; i < inlineVideos.length; i += CONCURRENCY) {
          const batch = inlineVideos.slice(i, i + CONCURRENCY);
          const results = await Promise.allSettled(batch.map(v => processOneVideo(v)));
          for (const result of results) {
            if (result.status === 'fulfilled') {
              freshAnalyzedVideos.push(result.value);
            } else {
              logger.error('Failed to process fresh video', { error: String(result.reason) });
            }
          }
        }

        // Filter fresh videos: minimum 50% match
        let filteredFreshVideos = freshAnalyzedVideos.filter(
          video => video.relevanceScore >= 0.5
        );

        if (normalizedTags.length > 0) {
          filteredFreshVideos = filteredFreshVideos.filter(video =>
            video.tags.some(t => normalizedTags.includes(t.tag))
          );
        }

        // Merge fresh analyzed videos with existing, sort by relevance then views, cap at 50
        const mergedVideos = [...filteredFreshVideos, ...analyzedVideos];
        mergedVideos.sort((a, b) => {
          if (a.relevanceScore !== b.relevanceScore) return b.relevanceScore - a.relevanceScore;
          const aHasViews = a.views != null && a.views > 0 ? 1 : 0;
          const bHasViews = b.views != null && b.views > 0 ? 1 : 0;
          if (aHasViews !== bHasViews) return bHasViews - aHasViews;
          return b.sortScore - a.sortScore;
        });
        const allAnalyzedVideos = mergedVideos.slice(0, 50).map(({ sortScore, ...video }) => video);

        // Process remaining fresh videos in background (fire-and-forget)
        const remainingVideos = freshYoutubeVideosRaw.slice(INLINE_LIMIT);
        if (remainingVideos.length > 0) {
          processBackgroundVideos(ctx.prisma, remainingVideos).catch((err: unknown) =>
            logger.error('Background video processing error', { error: err instanceof Error ? err.message : String(err) })
          );
        }

        // Build unanalyzed YouTube video list for "Fresh from YouTube" section
        const unanalyzedYoutubeVideos = remainingVideos.map(ytVideo => ({
          youtubeId: ytVideo.id,
          title: ytVideo.snippet.title,
          description: ytVideo.snippet.description || null,
          thumbnailUrl: ytVideo.snippet.thumbnails.high?.url || ytVideo.snippet.thumbnails.medium?.url || ytVideo.snippet.thumbnails.default.url,
          publishedAt: ytVideo.snippet.publishedAt,
          views: ytVideo.statistics?.viewCount ? parseInt(ytVideo.statistics.viewCount, 10) : null,
        }));

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
            logger.error('Failed to persist demand signal', { error: error instanceof Error ? error.message : String(error) });
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
          logger.error('Failed to log search', { error: error instanceof Error ? error.message : String(error) });
        }

        return {
          // All analyzed videos (database + freshly extracted from YouTube)
          analyzedVideos: allAnalyzedVideos,
          // Unanalyzed YouTube videos for "Fresh from YouTube" section
          youtubeVideos: unanalyzedYoutubeVideos,
          // Rate limit info
          rateLimitRemaining,
          // Whether partial matches are included in results
          lowRelevanceFallback: allAnalyzedVideos.some(v => v.relevanceScore < 1.0),
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
        };
      } catch (error) {
        logger.error('Search error', { error: error instanceof Error ? error.message : String(error) });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to perform search',
        });
      }
    }),

  getTranscript: t.procedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ input, ctx }) => {
      const video = await ctx.prisma.video.findUnique({
        where: { id: input.videoId },
        select: {
          transcript: true,
          transcriptLanguage: true,
          transcriptEnglish: true,
        },
      });
      if (!video?.transcript) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Transcript not available' });
      }
      return video;
    }),

  translateTranscript: t.procedure
    .input(z.object({ videoId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const video = await ctx.prisma.video.findUnique({
        where: { id: input.videoId },
        select: {
          transcript: true,
          transcriptLanguage: true,
          transcriptEnglish: true,
        },
      });
      if (!video?.transcript) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Transcript not available' });
      }
      // Return cached translation if available
      if (video.transcriptEnglish) {
        return { transcriptEnglish: video.transcriptEnglish, language: video.transcriptLanguage };
      }
      const { translatedText, originalLanguage, wasTranslated } = await detectAndTranslate(video.transcript);
      if (wasTranslated) {
        await ctx.prisma.video.update({
          where: { id: input.videoId },
          data: {
            transcriptEnglish: translatedText,
            transcriptLanguage: originalLanguage,
          },
        });
      }
      return {
        transcriptEnglish: wasTranslated ? translatedText : video.transcript,
        language: originalLanguage,
      };
    }),
});
