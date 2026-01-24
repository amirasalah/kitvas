/**
 * Intelligent Query Generation for Video Ingestion
 * 
 * This module generates ingredient-focused queries instead of generic recipe queries.
 * It aligns with Kitvas's ingredient-level intelligence strategy and builds the data moat.
 * 
 * Strategy:
 * 1. Use ingredient combinations (not recipe names)
 * 2. Leverage YouTube autocomplete for demand signals
 * 3. Use existing search patterns from database
 * 4. Focus on popular ingredient pairs
 * 5. Build ingredient co-occurrence intelligence
 */

import { PrismaClient } from '@prisma/client';

export interface QueryGenerationOptions {
  maxQueries?: number;
  useAutocomplete?: boolean;
  useSearchPatterns?: boolean;
  usePopularCombinations?: boolean;
}

/**
 * Popular ingredient combinations for initial seeding
 * These are based on trending food content and common pairings
 */
const POPULAR_INGREDIENT_COMBINATIONS = [
  // Asian fusion (high demand)
  ['miso', 'pasta'],
  ['gochujang', 'chicken'],
  ['gochujang', 'pasta'],
  ['miso', 'chicken'],
  ['sesame', 'noodles'],
  ['soy', 'garlic'],
  ['ginger', 'garlic'],
  ['kimchi', 'rice'],
  
  // Trending ingredients
  ['air fryer', 'tofu'],
  ['air fryer', 'chicken'],
  ['air fryer', 'potatoes'],
  ['tahini', 'pasta'],
  ['tahini', 'chicken'],
  ['harissa', 'chicken'],
  ['harissa', 'pasta'],
  
  // Classic combinations (for coverage)
  ['tomato', 'basil'],
  ['garlic', 'olive oil'],
  ['lemon', 'chicken'],
  ['parmesan', 'pasta'],
  ['butter', 'garlic'],
  
  // Vegan/plant-based (growing niche)
  ['cashew', 'cream'],
  ['nutritional yeast', 'pasta'],
  ['coconut milk', 'curry'],
  ['tofu', 'scramble'],
  
  // Technique + ingredient
  ['marinated', 'chicken'],
  ['roasted', 'vegetables'],
  ['caramelized', 'onions'],
];

/**
 * Base ingredients to generate combinations from
 * These are popular ingredients that appear frequently in food content
 */
const BASE_INGREDIENTS = [
  'miso', 'gochujang', 'tahini', 'harissa', 'kimchi',
  'chicken', 'tofu', 'pasta', 'rice', 'noodles',
  'garlic', 'ginger', 'soy', 'sesame', 'lemon',
  'tomato', 'basil', 'parmesan', 'butter', 'olive oil',
  'air fryer', 'cashew', 'coconut milk', 'nutritional yeast',
];

/**
 * Generate queries from YouTube autocomplete
 * This discovers what people are actually searching for
 */
export async function generateQueriesFromAutocomplete(
  seedIngredients: string[],
  apiKey: string,
  maxPerIngredient: number = 5
): Promise<string[]> {
  const queries: string[] = [];
  
  for (const ingredient of seedIngredients.slice(0, 10)) { // Limit to avoid rate limits
    try {
      // YouTube autocomplete endpoint (unofficial but widely used)
      const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(ingredient + ' ')}`;
      
      const response = await fetch(url);
      if (!response.ok) continue;
      
      const data = await response.json() as [string, string[]];
      const suggestions = data[1] || [];
      
      // Filter for ingredient-focused queries (not just recipe names)
      const ingredientQueries = suggestions
        .filter(s => {
          const lower = s.toLowerCase();
          // Prefer queries that contain the ingredient and another food term
          return lower.includes(ingredient.toLowerCase()) && 
                 (lower.includes('recipe') || lower.includes('how to') || 
                  lower.split(' ').length >= 3); // Multi-word suggests combination
        })
        .slice(0, maxPerIngredient);
      
      queries.push(...ingredientQueries);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.warn(`Failed to fetch autocomplete for ${ingredient}:`, error);
    }
  }
  
  return [...new Set(queries)]; // Remove duplicates
}

/**
 * Generate queries from existing search patterns in database
 * This builds on what users are actually searching for
 */
export async function generateQueriesFromSearchPatterns(
  prisma: PrismaClient,
  maxQueries: number = 20
): Promise<string[]> {
  try {
    // Get recent searches grouped by ingredient combinations
    const recentSearches = await prisma.search.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
        ingredients: {
          isEmpty: false,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    if (recentSearches.length === 0) {
      return [];
    }

    // Count ingredient combination frequencies
    const combinationCounts = new Map<string, number>();
    
    for (const search of recentSearches) {
      if (search.ingredients.length >= 2) {
        // Generate queries from ingredient pairs
        for (let i = 0; i < search.ingredients.length; i++) {
          for (let j = i + 1; j < search.ingredients.length; j++) {
            const combo = [search.ingredients[i], search.ingredients[j]]
              .sort()
              .join(' ');
            combinationCounts.set(combo, (combinationCounts.get(combo) || 0) + 1);
          }
        }
      }
    }

    // Get top combinations and convert to queries
    const topCombinations = Array.from(combinationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxQueries)
      .map(([combo]) => combo);

    return topCombinations;
  } catch (error) {
    console.warn('Failed to generate queries from search patterns:', error);
    return [];
  }
}

/**
 * Generate queries from popular ingredient combinations
 */
export function generateQueriesFromPopularCombinations(
  maxQueries?: number
): string[] {
  const combinations = maxQueries 
    ? POPULAR_INGREDIENT_COMBINATIONS.slice(0, maxQueries)
    : POPULAR_INGREDIENT_COMBINATIONS;
  
  return combinations.map(combo => combo.join(' '));
}

/**
 * Generate queries from ingredient co-occurrence in existing videos
 * This discovers which ingredients appear together in successful videos
 */
export async function generateQueriesFromVideoCoOccurrence(
  prisma: PrismaClient,
  maxQueries: number = 20
): Promise<string[]> {
  try {
    // Check if we have any videos first
    const videoCount = await prisma.video.count();
    if (videoCount === 0) {
      return [];
    }

    // Get ingredients that appear together in videos
    const videoIngredients = await prisma.videoIngredient.findMany({
      include: {
        ingredient: true,
        video: true,
      },
      take: Math.min(1000, videoCount * 10), // Sample size based on available videos
    });

    if (videoIngredients.length === 0) {
      return [];
    }

    // Build co-occurrence map
    const coOccurrence = new Map<string, Map<string, number>>();
    
    // Group by video
    const videosMap = new Map<string, string[]>();
    for (const vi of videoIngredients) {
      if (!videosMap.has(vi.videoId)) {
        videosMap.set(vi.videoId, []);
      }
      videosMap.get(vi.videoId)!.push(vi.ingredient.name);
    }

    // Count co-occurrences
    for (const [videoId, ingredients] of videosMap) {
      for (let i = 0; i < ingredients.length; i++) {
        for (let j = i + 1; j < ingredients.length; j++) {
          const ing1 = ingredients[i];
          const ing2 = ingredients[j];
          
          if (!coOccurrence.has(ing1)) {
            coOccurrence.set(ing1, new Map());
          }
          const map = coOccurrence.get(ing1)!;
          map.set(ing2, (map.get(ing2) || 0) + 1);
        }
      }
    }

    // Get top co-occurring pairs
    const pairs: Array<{ ingredients: string[]; count: number }> = [];
    for (const [ing1, map] of coOccurrence) {
      for (const [ing2, count] of map) {
        if (count >= 2) { // At least 2 videos with this combination
          pairs.push({
            ingredients: [ing1, ing2].sort(),
            count,
          });
        }
      }
    }

    // Sort by frequency and return as queries
    return pairs
      .sort((a, b) => b.count - a.count)
      .slice(0, maxQueries)
      .map(p => p.ingredients.join(' '));
  } catch (error) {
    console.warn('Failed to generate queries from co-occurrence:', error);
    return [];
  }
}

/**
 * Main function to generate intelligent queries
 * Combines multiple strategies based on options
 */
export async function generateIntelligentQueries(
  prisma: PrismaClient,
  options: QueryGenerationOptions = {}
): Promise<string[]> {
  const {
    maxQueries = 30,
    useAutocomplete = true,
    useSearchPatterns = true,
    usePopularCombinations = true,
  } = options;

  const allQueries: string[] = [];

  // Strategy 1: Popular combinations (always use as fallback)
  if (usePopularCombinations) {
    const popular = generateQueriesFromPopularCombinations(15);
    allQueries.push(...popular);
    console.log(`📊 Generated ${popular.length} queries from popular combinations`);
  }

  // Strategy 2: Search patterns from database (user behavior)
  if (useSearchPatterns) {
    try {
      const searchPatterns = await generateQueriesFromSearchPatterns(prisma, 15);
      allQueries.push(...searchPatterns);
      console.log(`🔍 Generated ${searchPatterns.length} queries from search patterns`);
    } catch (error) {
      console.warn('Search pattern generation failed:', error);
    }
  }

  // Strategy 3: Video co-occurrence (what ingredients appear together)
  try {
    const coOccurrence = await generateQueriesFromVideoCoOccurrence(prisma, 15);
    allQueries.push(...coOccurrence);
    console.log(`🔗 Generated ${coOccurrence.length} queries from ingredient co-occurrence`);
  } catch (error) {
    console.warn('Co-occurrence generation failed:', error);
  }

  // Strategy 4: YouTube autocomplete (demand signals)
  if (useAutocomplete && process.env.YOUTUBE_API_KEY) {
    try {
      const autocomplete = await generateQueriesFromAutocomplete(
        BASE_INGREDIENTS,
        process.env.YOUTUBE_API_KEY,
        3
      );
      allQueries.push(...autocomplete);
      console.log(`💡 Generated ${autocomplete.length} queries from YouTube autocomplete`);
    } catch (error) {
      console.warn('Autocomplete generation failed:', error);
    }
  }

  // Remove duplicates and limit
  const uniqueQueries = [...new Set(allQueries)]
    .filter(q => q.length > 0)
    .slice(0, maxQueries);

  console.log(`✨ Total unique queries generated: ${uniqueQueries.length}`);

  return uniqueQueries;
}

/**
 * Get ingredients that need more video coverage
 * Finds ingredient combinations with high search frequency but low video count
 */
export async function findGapOpportunities(
  prisma: PrismaClient,
  maxQueries: number = 10
): Promise<string[]> {
  try {
    // Get ingredient combinations from searches
    const searches = await prisma.search.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      take: 200,
    });

    const searchCombos = new Map<string, number>();
    for (const search of searches) {
      if (search.ingredients.length >= 2) {
        const combo = search.ingredients.sort().join(' ');
        searchCombos.set(combo, (searchCombos.get(combo) || 0) + 1);
      }
    }

    // Check video coverage for each combination
    const gaps: Array<{ query: string; searchCount: number; videoCount: number }> = [];
    
    for (const [combo, searchCount] of searchCombos) {
      if (searchCount < 2) continue; // Only consider combinations searched multiple times
      
      const ingredients = combo.split(' ');
      const videoCount = await prisma.video.count({
        where: {
          videoIngredients: {
            some: {
              ingredient: {
                name: {
                  in: ingredients,
                },
              },
            },
          },
        },
      });

      // Gap: high search, low video coverage
      if (searchCount > videoCount * 0.5) {
        gaps.push({
          query: combo,
          searchCount,
          videoCount,
        });
      }
    }

    // Sort by gap size (searchCount / videoCount ratio)
    gaps.sort((a, b) => {
      const ratioA = a.videoCount > 0 ? a.searchCount / a.videoCount : a.searchCount;
      const ratioB = b.videoCount > 0 ? b.searchCount / b.videoCount : b.searchCount;
      return ratioB - ratioA;
    });

    return gaps.slice(0, maxQueries).map(g => g.query);
  } catch (error) {
    console.warn('Failed to find gap opportunities:', error);
    return [];
  }
}
