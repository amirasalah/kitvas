/**
 * Background Video Processor
 *
 * Processes remaining YouTube videos that weren't handled synchronously
 * during search. Stores video records, extracts ingredients and tags.
 * Runs as fire-and-forget after the search response is sent.
 */

import type { PrismaClient } from '@prisma/client';
import type { YouTubeVideo } from './youtube.js';
import { extractIngredientsFromVideo, storeExtractedIngredients } from './ingredient-extractor.js';
import { extractTagsFromVideo, storeExtractedTags } from './tag-extractor.js';
import { fetchTranscript } from './transcript-fetcher.js';

export async function processBackgroundVideos(
  prisma: PrismaClient,
  videos: YouTubeVideo[]
): Promise<void> {
  for (const ytVideo of videos) {
    try {
      const dbVideo = await prisma.video.upsert({
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
          // Persist transcript to database
          await prisma.video.update({
            where: { id: dbVideo.id },
            data: { transcript },
          });
        }
      } catch {
        // Transcript not available — continue without
      }

      const extractedIngredients = await extractIngredientsFromVideo(
        ytVideo.snippet.title,
        ytVideo.snippet.description || null,
        transcript
      );

      if (extractedIngredients.length > 0) {
        await storeExtractedIngredients(prisma, dbVideo.id, extractedIngredients);
      }

      try {
        const extractedTags = await extractTagsFromVideo(
          ytVideo.snippet.title,
          ytVideo.snippet.description || null
        );
        if (extractedTags.length > 0) {
          await storeExtractedTags(prisma, dbVideo.id, extractedTags);
        }
      } catch (tagError) {
        console.warn(`[Background] Tag extraction failed for ${ytVideo.id}:`, tagError);
      }
    } catch (error) {
      console.error(`[Background] Failed to process video ${ytVideo.id}:`, error);
    }
  }
}
