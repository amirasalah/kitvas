/**
 * Fetch International Ingredients from Wikidata
 *
 * This script fetches ingredients from Wikidata SPARQL endpoint and
 * saves them to the database. It's designed to be run as a weekly cron job.
 *
 * Usage:
 *   npx tsx src/scripts/fetch-wikidata-ingredients.ts
 *   npm run ingredients:fetch
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';

// SPARQL query to get food ingredients with their labels and aliases
const INGREDIENTS_QUERY = `
SELECT DISTINCT ?item ?itemLabel ?altLabel WHERE {
  # Get food ingredients from various categories
  {
    ?item wdt:P31/wdt:P279* wd:Q25403900. # instance of food ingredient
  } UNION {
    ?item wdt:P31/wdt:P279* wd:Q178359. # instance of spice
  } UNION {
    ?item wdt:P31/wdt:P279* wd:Q7802. # instance of condiment
  } UNION {
    ?item wdt:P31/wdt:P279* wd:Q11004. # instance of vegetable
  } UNION {
    ?item wdt:P31/wdt:P279* wd:Q3314483. # instance of fruit
  } UNION {
    ?item wdt:P31/wdt:P279* wd:Q10990. # instance of grain
  }

  # Get alternative labels (aliases)
  OPTIONAL {
    ?item skos:altLabel ?altLabel.
    FILTER(LANG(?altLabel) = "en")
  }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 5000
`;

// Cuisine-specific queries for dishes (which often contain ingredient names)
const CUISINES: Record<string, string> = {
  japanese: 'Q192764',
  korean: 'Q647640',
  chinese: 'Q47721',
  thai: 'Q841984',
  vietnamese: 'Q1055026',
  indian: 'Q192077',
  mexican: 'Q207965',
  italian: 'Q191721',
  french: 'Q6661',
  greek: 'Q744027',
  turkish: 'Q654493',
  lebanese: 'Q1247972',
  moroccan: 'Q821003',
  ethiopian: 'Q533698',
  brazilian: 'Q774415',
  peruvian: 'Q749847',
  indonesian: 'Q936689',
  malaysian: 'Q1398961',
  filipino: 'Q1192545',
};

const DISHES_BY_CUISINE_QUERY = (cuisineId: string) => `
SELECT DISTINCT ?item ?itemLabel ?altLabel WHERE {
  ?item wdt:P361 wd:${cuisineId}.
  ?item wdt:P31/wdt:P279* wd:Q746549. # dish

  OPTIONAL {
    ?item skos:altLabel ?altLabel.
    FILTER(LANG(?altLabel) = "en")
  }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 500
`;

interface WikidataResult {
  item: { value: string };
  itemLabel: { value: string };
  altLabel?: { value: string };
}

interface FetchStats {
  newIngredients: number;
  newSynonyms: number;
  skipped: number;
  errors: string[];
}

async function queryWikidata(query: string): Promise<WikidataResult[]> {
  const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/sparql-results+json',
        'User-Agent': 'KitvasIngredientFetcher/1.0 (https://kitvas.io)',
      },
    });

    if (!response.ok) {
      throw new Error(`Wikidata query failed: ${response.status}`);
    }

    const data = (await response.json()) as { results: { bindings: WikidataResult[] } };
    return data.results.bindings;
  } catch (error) {
    console.error('Wikidata query error:', error);
    return [];
  }
}

interface ProcessedIngredient {
  name: string;
  aliases: string[];
}

function processResults(results: WikidataResult[]): Map<string, ProcessedIngredient> {
  const ingredients = new Map<string, ProcessedIngredient>();

  for (const result of results) {
    const name = result.itemLabel.value.toLowerCase().trim();

    // Skip if it looks like a Wikidata ID (Q followed by numbers)
    if (/^q\d+$/.test(name)) continue;

    // Skip very long names (likely descriptions, not ingredient names)
    if (name.length > 40) continue;

    // Skip names with certain patterns that indicate non-ingredients
    if (
      name.includes('cuisine') ||
      name.includes('cooking') ||
      name.includes('recipe') ||
      name.includes('dish') ||
      name.includes('food')
    )
      continue;

    // Skip single-character names
    if (name.length < 2) continue;

    const existing = ingredients.get(name) || { name, aliases: [] };

    // Add alternative label if present
    if (result.altLabel?.value) {
      const alias = result.altLabel.value.toLowerCase().trim();
      if (alias !== name && !existing.aliases.includes(alias) && alias.length <= 40 && alias.length >= 2) {
        existing.aliases.push(alias);
      }
    }

    ingredients.set(name, existing);
  }

  return ingredients;
}

async function saveToDatabase(ingredients: Map<string, ProcessedIngredient>): Promise<FetchStats> {
  const stats: FetchStats = {
    newIngredients: 0,
    newSynonyms: 0,
    skipped: 0,
    errors: [],
  };

  for (const [name, data] of ingredients) {
    try {
      // Only process ingredients that have aliases
      if (data.aliases.length === 0) {
        stats.skipped++;
        continue;
      }

      // First, ensure the ingredient exists
      let ingredient = await prisma.ingredient.findUnique({
        where: { name },
      });

      if (!ingredient) {
        ingredient = await prisma.ingredient.create({
          data: { name },
        });
        stats.newIngredients++;
        console.log(`  + New ingredient: ${name}`);
      }

      // Add synonyms
      for (const alias of data.aliases) {
        try {
          await prisma.ingredientSynonym.create({
            data: {
              ingredientId: ingredient.id,
              synonym: alias,
              source: 'wikidata',
            },
          });
          stats.newSynonyms++;
        } catch (e: unknown) {
          // Unique constraint violation means it already exists
          if ((e as { code?: string }).code !== 'P2002') {
            throw e;
          }
        }
      }
    } catch (error) {
      stats.errors.push(`Error processing ${name}: ${error}`);
    }
  }

  return stats;
}

async function main() {
  console.log('=== Wikidata Ingredient Fetcher ===');
  console.log(`Started at: ${new Date().toISOString()}\n`);

  const startTime = Date.now();
  const allIngredients = new Map<string, ProcessedIngredient>();

  try {
    // Fetch general ingredients
    console.log('Fetching general food ingredients from Wikidata...');
    const generalResults = await queryWikidata(INGREDIENTS_QUERY);
    console.log(`  Received ${generalResults.length} results`);

    const generalIngredients = processResults(generalResults);
    console.log(`  Processed ${generalIngredients.size} unique ingredients\n`);

    // Merge into main map
    for (const [name, data] of generalIngredients) {
      allIngredients.set(name, data);
    }

    // Fetch cuisine-specific dishes
    for (const [cuisineName, cuisineId] of Object.entries(CUISINES)) {
      console.log(`Fetching ${cuisineName} dishes...`);
      const results = await queryWikidata(DISHES_BY_CUISINE_QUERY(cuisineId));
      const cuisineIngredients = processResults(results);

      // Merge into main map
      for (const [name, data] of cuisineIngredients) {
        const existing = allIngredients.get(name);
        if (existing) {
          // Merge aliases
          for (const alias of data.aliases) {
            if (!existing.aliases.includes(alias)) {
              existing.aliases.push(alias);
            }
          }
        } else {
          allIngredients.set(name, data);
        }
      }

      // Small delay to be nice to Wikidata servers (rate limiting)
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`\nTotal unique items found: ${allIngredients.size}`);
    console.log(`Items with aliases: ${Array.from(allIngredients.values()).filter((i) => i.aliases.length > 0).length}`);

    // Save to database
    console.log('\nSaving to database...');
    const stats = await saveToDatabase(allIngredients);

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('\n=== Fetch Complete ===');
    console.log(`New ingredients: ${stats.newIngredients}`);
    console.log(`New synonyms: ${stats.newSynonyms}`);
    console.log(`Skipped (no aliases): ${stats.skipped}`);
    console.log(`Duration: ${duration}s`);

    if (stats.errors.length > 0) {
      console.log(`Errors: ${stats.errors.length}`);
      stats.errors.slice(0, 10).forEach((e) => console.error(`  - ${e}`));
    }

    // Log the job
    await prisma.ingredientFetchJob.create({
      data: {
        source: 'wikidata',
        status: stats.errors.length > 0 ? 'completed_with_errors' : 'completed',
        newIngredients: stats.newIngredients,
        newSynonyms: stats.newSynonyms,
        skipped: stats.skipped,
        errorMessage: stats.errors.length > 0 ? stats.errors.slice(0, 20).join('\n') : null,
        duration,
      },
    });

    console.log('\nJob logged to IngredientFetchJob table.');
  } catch (error) {
    console.error('Fetch failed:', error);

    await prisma.ingredientFetchJob.create({
      data: {
        source: 'wikidata',
        status: 'failed',
        errorMessage: String(error),
        duration: Math.round((Date.now() - startTime) / 1000),
      },
    });

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
