/**
 * Search Cache Layer
 * Caches YouTube API responses for 24 hours to stay within quota limits
 */

import type { YouTubeVideo } from './youtube.js';

interface CachedSearch {
  videos: YouTubeVideo[];
  cachedAt: number;
}

const cache = new Map<string, CachedSearch>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a cache key from ingredients list
 * Normalizes and sorts ingredients for consistent keys
 */
export function getCacheKey(ingredients: string[]): string {
  return ingredients
    .map(i => i.toLowerCase().trim())
    .sort()
    .join('|');
}

/**
 * Get cached YouTube search results
 * Returns null if not cached or expired
 */
export function getCachedSearch(ingredients: string[]): YouTubeVideo[] | null {
  const key = getCacheKey(ingredients);
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  // Check if expired
  if (Date.now() - entry.cachedAt > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.videos;
}

/**
 * Cache YouTube search results
 */
export function setCachedSearch(ingredients: string[], videos: YouTubeVideo[]): void {
  const key = getCacheKey(ingredients);
  cache.set(key, {
    videos,
    cachedAt: Date.now(),
  });
}

/**
 * Clear expired entries (call periodically)
 */
export function cleanupCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.cachedAt > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

/**
 * Get cache stats for monitoring
 */
export function getCacheStats(): { size: number; oldestEntry: number | null } {
  let oldest: number | null = null;
  for (const entry of cache.values()) {
    if (oldest === null || entry.cachedAt < oldest) {
      oldest = entry.cachedAt;
    }
  }
  return {
    size: cache.size,
    oldestEntry: oldest,
  };
}
