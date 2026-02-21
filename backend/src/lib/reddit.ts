/**
 * Reddit API client for fetching food-related posts.
 * Uses OAuth2 app-only (client_credentials) authentication.
 */

const REDDIT_API_BASE = 'https://oauth.reddit.com';
const REDDIT_AUTH_URL = 'https://www.reddit.com/api/v1/access_token';
const USER_AGENT = 'kitvas:v1.0.0 (by /u/kitvas-bot)';

export const FOOD_SUBREDDITS = [
  'food',
  'cooking',
  'recipes',
  'foodhacks',
  'MealPrepSunday',
  'EatCheapAndHealthy',
  'Baking',
  'AskCulinary',
  'GifRecipes',
];

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are required');
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(REDDIT_AUTH_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error(`Reddit auth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

export interface RedditPostData {
  redditId: string;
  subreddit: string;
  title: string;
  selfText: string | null;
  url: string | null;
  author: string;
  score: number;
  numComments: number;
  upvoteRatio: number | null;
  permalink: string;
  isVideo: boolean;
  thumbnailUrl: string | null;
  createdUtc: Date;
}

/**
 * Fetch hot posts from a subreddit.
 */
export async function fetchSubredditHot(
  subreddit: string,
  limit: number = 25
): Promise<RedditPostData[]> {
  const token = await getAccessToken();

  const res = await fetch(
    `${REDDIT_API_BASE}/r/${subreddit}/hot.json?limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': USER_AGENT,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Reddit API error for r/${subreddit}: ${res.status}`);
  }

  const data = await res.json() as {
    data: {
      children: Array<{
        data: {
          id: string;
          subreddit: string;
          title: string;
          selftext: string;
          url: string;
          author: string;
          score: number;
          num_comments: number;
          upvote_ratio: number;
          permalink: string;
          is_video: boolean;
          thumbnail: string;
          created_utc: number;
          stickied: boolean;
        };
      }>;
    };
  };

  return data.data.children
    .filter(child => !child.data.stickied) // Skip stickied/pinned posts
    .map(child => {
      const d = child.data;
      return {
        redditId: `t3_${d.id}`,
        subreddit: d.subreddit,
        title: d.title,
        selfText: d.selftext || null,
        url: d.url || null,
        author: d.author,
        score: d.score,
        numComments: d.num_comments,
        upvoteRatio: d.upvote_ratio,
        permalink: d.permalink,
        isVideo: d.is_video,
        thumbnailUrl: d.thumbnail && d.thumbnail.startsWith('http') ? d.thumbnail : null,
        createdUtc: new Date(d.created_utc * 1000),
      };
    });
}

/**
 * Fetch hot posts from all monitored food subreddits.
 */
export async function fetchAllFoodSubreddits(
  limit: number = 25
): Promise<RedditPostData[]> {
  const allPosts: RedditPostData[] = [];

  for (const subreddit of FOOD_SUBREDDITS) {
    try {
      const posts = await fetchSubredditHot(subreddit, limit);
      allPosts.push(...posts);
      // Small delay between requests to be respectful
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      console.error(`[Reddit] Failed to fetch r/${subreddit}:`, error);
    }
  }

  return allPosts;
}
