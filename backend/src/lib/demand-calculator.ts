/**
 * Demand Calculator Module
 *
 * Calculates demand bands (High/Medium/Low/Unknown) for ingredient combinations.
 * Uses search pattern frequency and video supply data.
 *
 * Strategy:
 * 1. Count how often this ingredient combination has been searched
 * 2. Count how many videos exist with these ingredients
 * 3. Calculate demand = search frequency / video supply
 * 4. Assign bands based on thresholds
 */

import { PrismaClient } from '@prisma/client';

export type DemandBand = 'high' | 'medium' | 'low' | 'unknown';

export interface DemandSignal {
  band: DemandBand;
  searchCount: number;
  videoCount: number;
  relatedSearches: string[][];
  confidence: number;
}

// Cache demand calculations (in-memory, 1 hour TTL)
const demandCache = new Map<string, { signal: DemandSignal; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Calculate demand band for a set of ingredients
 */
export async function calculateDemand(
  prisma: PrismaClient,
  ingredients: string[]
): Promise<DemandSignal> {
  // Normalize and sort for consistent cache key
  const normalizedIngredients = ingredients
    .map((i) => i.toLowerCase().trim())
    .sort();
  const cacheKey = normalizedIngredients.join(',');

  // Check cache
  const cached = demandCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.signal;
  }

  try {
    // 1. Count searches containing these ingredients (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all searches from the last 30 days
    const recentSearches = await prisma.search.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        ingredients: true,
      },
    });

    // Count searches that contain ALL the queried ingredients
    let searchCount = 0;
    for (const search of recentSearches) {
      const searchIngredients = search.ingredients.map((i) => i.toLowerCase());
      const hasAll = normalizedIngredients.every((ing) =>
        searchIngredients.includes(ing)
      );
      if (hasAll) {
        searchCount++;
      }
    }

    // 2. Count videos with these ingredients
    const videoCount = await prisma.video.count({
      where: {
        videoIngredients: {
          some: {
            ingredient: {
              name: { in: normalizedIngredients },
            },
          },
        },
      },
    });

    // 3. Find related searches (searches that share at least one ingredient)
    const relatedSearchesRaw = recentSearches
      .filter((search) => {
        const searchIngredients = search.ingredients.map((i) => i.toLowerCase());
        return normalizedIngredients.some((ing) =>
          searchIngredients.includes(ing)
        );
      })
      .map((s) => s.ingredients)
      .slice(0, 5); // Limit to 5 related searches

    // 4. Calculate demand band
    const band = calculateBand(searchCount, videoCount);
    const confidence = calculateConfidence(searchCount, videoCount);

    const signal: DemandSignal = {
      band,
      searchCount,
      videoCount,
      relatedSearches: relatedSearchesRaw,
      confidence,
    };

    // Cache the result
    demandCache.set(cacheKey, { signal, timestamp: Date.now() });

    return signal;
  } catch (error) {
    console.error('Error calculating demand:', error);
    return {
      band: 'unknown',
      searchCount: 0,
      videoCount: 0,
      relatedSearches: [],
      confidence: 0,
    };
  }
}

/**
 * Calculate demand band based on search/supply ratio
 */
function calculateBand(searchCount: number, videoCount: number): DemandBand {
  // Not enough data
  if (searchCount < 3) {
    return 'unknown';
  }

  // Calculate demand ratio (searches per video)
  // Higher ratio = more demand relative to supply
  const ratio = videoCount > 0 ? searchCount / videoCount : searchCount * 2;

  // Thresholds (can be tuned based on real data)
  if (ratio >= 0.5) {
    return 'high'; // Many searches relative to available videos
  } else if (ratio >= 0.2) {
    return 'medium';
  } else if (searchCount >= 3) {
    return 'low'; // Some searches but lots of videos
  }

  return 'unknown';
}

/**
 * Calculate confidence in the demand signal
 */
function calculateConfidence(searchCount: number, videoCount: number): number {
  // Confidence increases with more data points
  const searchConfidence = Math.min(1, searchCount / 20); // Max at 20 searches
  const videoConfidence = Math.min(1, videoCount / 50); // Max at 50 videos

  // Combined confidence (need both to be confident)
  return (searchConfidence + videoConfidence) / 2;
}

/**
 * Get trending ingredient combinations
 * Returns the most searched ingredient combinations from the last 7 days
 */
export async function getTrendingIngredients(
  prisma: PrismaClient,
  limit: number = 10
): Promise<{ ingredients: string[]; count: number }[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentSearches = await prisma.search.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
    },
    select: {
      ingredients: true,
    },
  });

  // Count ingredient combinations
  const combinationCounts = new Map<string, number>();
  for (const search of recentSearches) {
    const key = search.ingredients.sort().join(',');
    combinationCounts.set(key, (combinationCounts.get(key) || 0) + 1);
  }

  // Sort by count and return top N
  const sorted = Array.from(combinationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({
      ingredients: key.split(','),
      count,
    }));

  return sorted;
}

/**
 * Clear the demand cache (useful for testing or manual refresh)
 */
export function clearDemandCache(): void {
  demandCache.clear();
}
