/**
 * X/Twitter API v2 client for fetching food-related tweets.
 * Uses Bearer token authentication (Basic tier).
 */

const X_API_BASE = 'https://api.twitter.com/2';

export const FOOD_SEARCH_QUERIES = [
  '#recipe -is:retweet',
  '#foodtrend -is:retweet',
  '#cooking -is:retweet',
  '#foodie has:media -is:retweet',
  '#baking -is:retweet',
  'trending recipe -is:retweet',
  'viral food -is:retweet',
];

export interface TweetData {
  tweetId: string;
  authorUsername: string;
  authorName: string | null;
  text: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  quoteCount: number;
  impressionCount: number | null;
  hashtags: string[];
  mediaUrl: string | null;
  createdAt: Date;
}

interface TwitterSearchResponse {
  data?: Array<{
    id: string;
    text: string;
    created_at: string;
    author_id: string;
    public_metrics: {
      retweet_count: number;
      reply_count: number;
      like_count: number;
      quote_count: number;
      impression_count?: number;
    };
    entities?: {
      hashtags?: Array<{ tag: string }>;
    };
    attachments?: {
      media_keys?: string[];
    };
  }>;
  includes?: {
    users?: Array<{
      id: string;
      username: string;
      name: string;
    }>;
    media?: Array<{
      media_key: string;
      url?: string;
      preview_image_url?: string;
    }>;
  };
  meta?: {
    result_count: number;
    next_token?: string;
  };
}

/**
 * Search recent tweets using X API v2.
 */
export async function searchRecentTweets(
  query: string,
  maxResults: number = 25
): Promise<TweetData[]> {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) {
    throw new Error('X_BEARER_TOKEN is required');
  }

  const params = new URLSearchParams({
    query,
    max_results: String(Math.min(maxResults, 100)),
    'tweet.fields': 'created_at,public_metrics,entities,attachments',
    'user.fields': 'username,name',
    'media.fields': 'url,preview_image_url',
    expansions: 'author_id,attachments.media_keys',
  });

  const res = await fetch(`${X_API_BASE}/tweets/search/recent?${params}`, {
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`X API error: ${res.status} ${errorText}`);
  }

  const data = (await res.json()) as TwitterSearchResponse;
  if (!data.data) return [];

  // Build lookup maps for includes
  const userMap = new Map<string, { username: string; name: string }>();
  for (const user of data.includes?.users || []) {
    userMap.set(user.id, { username: user.username, name: user.name });
  }

  const mediaMap = new Map<string, string>();
  for (const media of data.includes?.media || []) {
    if (media.url || media.preview_image_url) {
      mediaMap.set(media.media_key, media.url || media.preview_image_url!);
    }
  }

  return data.data.map(tweet => {
    const author = userMap.get(tweet.author_id);
    const mediaKey = tweet.attachments?.media_keys?.[0];
    const mediaUrl = mediaKey ? mediaMap.get(mediaKey) || null : null;

    return {
      tweetId: tweet.id,
      authorUsername: author?.username || 'unknown',
      authorName: author?.name || null,
      text: tweet.text,
      likeCount: tweet.public_metrics.like_count,
      retweetCount: tweet.public_metrics.retweet_count,
      replyCount: tweet.public_metrics.reply_count,
      quoteCount: tweet.public_metrics.quote_count,
      impressionCount: tweet.public_metrics.impression_count ?? null,
      hashtags: tweet.entities?.hashtags?.map(h => h.tag) || [],
      mediaUrl,
      createdAt: new Date(tweet.created_at),
    };
  });
}

/**
 * Search all food-related queries and return deduplicated tweets.
 */
export async function fetchAllFoodTweets(
  extraQueries: string[] = []
): Promise<TweetData[]> {
  const allQueries = [...FOOD_SEARCH_QUERIES, ...extraQueries];
  const allTweets: TweetData[] = [];
  const seenIds = new Set<string>();

  for (const query of allQueries) {
    try {
      const tweets = await searchRecentTweets(query, 25);
      for (const tweet of tweets) {
        if (!seenIds.has(tweet.tweetId)) {
          seenIds.add(tweet.tweetId);
          allTweets.push(tweet);
        }
      }
      // Respect rate limits: 1 request per second
      await new Promise(r => setTimeout(r, 1000));
    } catch (error) {
      console.error(`[X] Failed to search "${query}":`, error);
    }
  }

  return allTweets;
}
