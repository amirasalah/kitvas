/**
 * YouTube Transcript Fetcher
 *
 * Fetches video transcripts using youtube-transcript-plus (Innertube API).
 * This uses YouTube's internal API — no OAuth or quota needed.
 *
 * Note: Some videos don't have transcripts available (disabled, private, etc.)
 */

import { fetchTranscript as ytFetchTranscript } from 'youtube-transcript-plus';

/**
 * Fetch transcript for a YouTube video
 * Returns the full transcript as a single string, or null if not available.
 * Prefers English tracks but falls back to any available language.
 *
 * @param videoId YouTube video ID (not full URL)
 * @returns Full transcript text or null
 */
export async function fetchTranscript(videoId: string): Promise<string | null> {
  // Try English first, then fall back to any available language
  const langs = ['en', undefined]; // undefined = default/any language

  for (const lang of langs) {
    try {
      const segments = await ytFetchTranscript(videoId, lang ? { lang } : undefined);

      if (!segments || segments.length === 0) {
        continue;
      }

      const fullText = segments
        .map((s: { text: string }) => s.text)
        .join(' ')
        .replace(/&amp;/g, '&')       // Decode HTML entities (& first since others may be double-encoded)
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\[.*?\]/g, '')     // Remove [Music], [Applause], etc.
        .replace(/♪[^♪]*♪/g, '')     // Remove music note markers
        .replace(/\s+/g, ' ')        // Normalize whitespace
        .trim();

      if (fullText) return fullText;
    } catch {
      continue;
    }
  }

  return null;
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
