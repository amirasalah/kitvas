/**
 * YouTube Transcript Fetcher
 *
 * Fetches video transcripts using the youtube-transcript package.
 * This uses an unofficial API that doesn't require OAuth or quota.
 *
 * Note: Some videos don't have transcripts available (disabled, private, etc.)
 */

import { YoutubeTranscript, type TranscriptResponse } from 'youtube-transcript';

/**
 * Fetch transcript for a YouTube video
 * Returns the full transcript as a single string, or null if not available
 *
 * @param videoId YouTube video ID (not full URL)
 * @returns Full transcript text or null
 */
export async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    const segments: TranscriptResponse[] = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en', // Prefer English transcripts
    });

    if (!segments || segments.length === 0) {
      return null;
    }

    // Join all segments into one text blob
    // Clean up common transcript artifacts
    const fullText = segments
      .map(s => s.text)
      .join(' ')
      .replace(/\[.*?\]/g, '') // Remove [Music], [Applause], etc.
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return fullText || null;
  } catch (error) {
    // Many videos don't have transcripts — this is expected, not an error
    // Only log if it's an unexpected error type
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Don't log for expected "not available" errors
    if (!errorMessage.includes('disabled') &&
        !errorMessage.includes('not available') &&
        !errorMessage.includes('unavailable')) {
      console.warn(`[Transcript] Error fetching ${videoId}: ${errorMessage}`);
    }

    return null;
  }
}

/**
 * Fetch transcripts for multiple videos with rate limiting
 * Returns a map of videoId -> transcript (null if not available)
 *
 * @param videoIds Array of YouTube video IDs
 * @param delayMs Delay between requests to avoid rate limiting (default 2000ms)
 */
export async function fetchTranscriptsBatch(
  videoIds: string[],
  delayMs: number = 2000
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();

  for (let i = 0; i < videoIds.length; i++) {
    const videoId = videoIds[i];
    const transcript = await fetchTranscript(videoId);
    results.set(videoId, transcript);

    // Rate limiting: wait between requests (except for last one)
    if (i < videoIds.length - 1 && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
