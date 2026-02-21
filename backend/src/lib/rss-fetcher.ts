/**
 * RSS feed fetcher for food publication articles.
 * Uses rss-parser to parse RSS/Atom feeds.
 */

// Dynamic import for rss-parser (CommonJS module)
let Parser: any = null;

async function getParser() {
  if (!Parser) {
    const mod = await import('rss-parser');
    Parser = mod.default || mod;
  }
  return new Parser();
}

export interface FeedSource {
  name: string;      // Internal identifier (e.g., "seriouseats")
  label: string;     // Display name
  feedUrl: string;
}

export const FOOD_FEEDS: FeedSource[] = [
  {
    name: 'seriouseats',
    label: 'Serious Eats',
    feedUrl: 'https://www.seriouseats.com/feeds/serious-eats',
  },
  {
    name: 'thekitchn',
    label: 'The Kitchn',
    feedUrl: 'https://www.thekitchn.com/rss',
  },
  {
    name: 'foodnetwork',
    label: 'Food Network',
    feedUrl: 'https://www.foodnetwork.com/fn-dish/rss.xml',
  },
  {
    name: 'allrecipes',
    label: 'Allrecipes',
    feedUrl: 'https://www.allrecipes.com/feeds/rss',
  },
  {
    name: 'epicurious',
    label: 'Epicurious',
    feedUrl: 'https://www.epicurious.com/feed/rss',
  },
  {
    name: 'bonappetit',
    label: 'Bon Appetit',
    feedUrl: 'https://www.bonappetit.com/feed/rss',
  },
  {
    name: 'smittenkitchen',
    label: 'Smitten Kitchen',
    feedUrl: 'https://smittenkitchen.com/feed/',
  },
  {
    name: 'minimalistbaker',
    label: 'Minimalist Baker',
    feedUrl: 'https://minimalistbaker.com/feed/',
  },
];

export interface ArticleData {
  url: string;
  source: string;
  title: string;
  author: string | null;
  excerpt: string | null;
  imageUrl: string | null;
  categories: string[];
  publishedAt: Date;
}

/**
 * Fetch and parse a single RSS feed.
 */
export async function fetchFeed(feedSource: FeedSource): Promise<ArticleData[]> {
  const parser = await getParser();

  const feed = await parser.parseURL(feedSource.feedUrl);
  if (!feed.items) return [];

  return feed.items.map((item: any) => {
    // Extract image from enclosure, media, or content
    let imageUrl: string | null = null;
    if (item.enclosure?.url) {
      imageUrl = item.enclosure.url;
    } else if (item['media:content']?.$.url) {
      imageUrl = item['media:content'].$.url;
    }

    // Clean excerpt: strip HTML tags, limit to 300 chars
    let excerpt: string | null = null;
    if (item.contentSnippet) {
      excerpt = item.contentSnippet.slice(0, 300);
    } else if (item.content) {
      excerpt = item.content.replace(/<[^>]*>/g, '').slice(0, 300);
    }

    return {
      url: item.link || '',
      source: feedSource.name,
      title: item.title || 'Untitled',
      author: item.creator || item.author || null,
      excerpt,
      imageUrl,
      categories: item.categories || [],
      publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
    };
  }).filter((a: ArticleData) => a.url); // Filter out items without URLs
}

/**
 * Fetch all configured food publication feeds.
 */
export async function fetchAllFeeds(): Promise<ArticleData[]> {
  const allArticles: ArticleData[] = [];

  for (const feedSource of FOOD_FEEDS) {
    try {
      const articles = await fetchFeed(feedSource);
      allArticles.push(...articles);
      console.log(`[RSS] Fetched ${articles.length} articles from ${feedSource.label}`);
    } catch (error) {
      console.error(`[RSS] Failed to fetch ${feedSource.label}:`, error);
    }
  }

  return allArticles;
}
