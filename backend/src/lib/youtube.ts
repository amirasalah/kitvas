/**
 * YouTube API integration
 * This will be used in Week 1 to fetch and store video data
 */

export interface YouTubeSearchResult {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
  };
}

export interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    channelId?: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
  };
  statistics?: {
    viewCount: string;
  };
}

export async function searchYouTubeVideos(
  query: string,
  apiKey: string,
  maxResults: number = 10
): Promise<YouTubeSearchResult[]> {
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', maxResults.toString());
  url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`YouTube API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json() as { items: YouTubeSearchResult[] };
  return data.items || [];
}

export async function getVideoDetails(
  videoIds: string[],
  apiKey: string
): Promise<YouTubeVideo[]> {
  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.searchParams.set('part', 'snippet,statistics');
  url.searchParams.set('id', videoIds.join(','));
  url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.statusText}`);
  }

  const data = await response.json() as { items: YouTubeVideo[] };
  return data.items || [];
}

/**
 * Get YouTube autocomplete suggestions
 * This helps discover what people are actually searching for
 * Note: This uses the unofficial autocomplete endpoint
 */
export async function getYouTubeAutocomplete(
  query: string,
  maxResults: number = 10
): Promise<string[]> {
  try {
    // YouTube autocomplete endpoint (unofficial but widely used)
    const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json() as [string, string[]];
    const suggestions = data[1] || [];
    
    return suggestions.slice(0, maxResults);
  } catch (error) {
    console.warn(`Failed to fetch autocomplete for "${query}":`, error);
    return [];
  }
}
