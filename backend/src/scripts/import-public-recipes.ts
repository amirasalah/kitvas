/**
 * Import Public Recipe Datasets
 *
 * Imports recipes from free public APIs to bootstrap the database.
 * Sources:
 *   - TheMealDB (free, ~600 recipes with ingredients)
 *   - RecipePuppy (free, thousands of recipes)
 *
 * Usage:
 *   npm run import:recipes
 *   npm run import:recipes -- --source mealdb
 *   npm run import:recipes -- --source all
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

// ============================================
// TheMealDB API (Free, no key needed)
// ============================================

const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

interface MealDBMeal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strYoutube: string;
  strIngredient1?: string;
  strIngredient2?: string;
  strIngredient3?: string;
  strIngredient4?: string;
  strIngredient5?: string;
  strIngredient6?: string;
  strIngredient7?: string;
  strIngredient8?: string;
  strIngredient9?: string;
  strIngredient10?: string;
  strIngredient11?: string;
  strIngredient12?: string;
  strIngredient13?: string;
  strIngredient14?: string;
  strIngredient15?: string;
  strIngredient16?: string;
  strIngredient17?: string;
  strIngredient18?: string;
  strIngredient19?: string;
  strIngredient20?: string;
  strMeasure1?: string;
  strMeasure2?: string;
  strMeasure3?: string;
  strMeasure4?: string;
  strMeasure5?: string;
  strMeasure6?: string;
  strMeasure7?: string;
  strMeasure8?: string;
  strMeasure9?: string;
  strMeasure10?: string;
  strMeasure11?: string;
  strMeasure12?: string;
  strMeasure13?: string;
  strMeasure14?: string;
  strMeasure15?: string;
  strMeasure16?: string;
  strMeasure17?: string;
  strMeasure18?: string;
  strMeasure19?: string;
  strMeasure20?: string;
}

interface MealDBIngredient {
  idIngredient: string;
  strIngredient: string;
  strDescription: string | null;
  strType: string | null;
}

function extractIngredients(meal: MealDBMeal): string[] {
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}` as keyof MealDBMeal] as string | undefined;
    if (ing && ing.trim()) {
      ingredients.push(ing.trim().toLowerCase());
    }
  }
  return ingredients;
}

async function fetchMealDBCategories(): Promise<string[]> {
  const res = await fetch(`${MEALDB_BASE}/categories.php`);
  const data = await res.json() as { categories: { strCategory: string }[] };
  return data.categories.map(c => c.strCategory);
}

async function fetchMealDBByCategory(category: string): Promise<MealDBMeal[]> {
  const res = await fetch(`${MEALDB_BASE}/filter.php?c=${encodeURIComponent(category)}`);
  const data = await res.json() as { meals: { idMeal: string }[] | null };
  if (!data.meals) return [];

  // Fetch full details for each meal
  const meals: MealDBMeal[] = [];
  for (const m of data.meals) {
    const detailRes = await fetch(`${MEALDB_BASE}/lookup.php?i=${m.idMeal}`);
    const detailData = await detailRes.json() as { meals: MealDBMeal[] | null };
    if (detailData.meals?.[0]) {
      meals.push(detailData.meals[0]);
    }
    // Rate limit
    await new Promise(r => setTimeout(r, 100));
  }
  return meals;
}

async function fetchMealDBByFirstLetter(): Promise<MealDBMeal[]> {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const allMeals: MealDBMeal[] = [];

  for (const letter of letters) {
    console.log(`   Fetching meals starting with "${letter}"...`);
    const res = await fetch(`${MEALDB_BASE}/search.php?f=${letter}`);
    const data = await res.json() as { meals: MealDBMeal[] | null };
    if (data.meals) {
      allMeals.push(...data.meals);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  return allMeals;
}

async function fetchAllMealDBIngredients(): Promise<MealDBIngredient[]> {
  const res = await fetch(`${MEALDB_BASE}/list.php?i=list`);
  const data = await res.json() as { meals: MealDBIngredient[] };
  return data.meals || [];
}

async function importMealDB(): Promise<{ recipes: number; ingredients: number; videoIngredients: number }> {
  console.log('\n📦 Importing from TheMealDB...');

  let recipesImported = 0;
  let ingredientsCreated = 0;
  let videoIngredientsCreated = 0;

  // First, import all ingredients from MealDB's ingredient list
  console.log('   Fetching ingredient list...');
  const mealdbIngredients = await fetchAllMealDBIngredients();
  console.log(`   Found ${mealdbIngredients.length} ingredients in MealDB`);

  for (const ing of mealdbIngredients) {
    const name = ing.strIngredient.toLowerCase().trim();
    if (!name || name.length < 2) continue;

    try {
      await prisma.ingredient.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      ingredientsCreated++;
    } catch {
      // Skip duplicates
    }
  }
  console.log(`   ✅ Imported ${ingredientsCreated} ingredients`);

  // Fetch all recipes
  console.log('   Fetching all recipes (this may take a few minutes)...');
  const allMeals = await fetchMealDBByFirstLetter();
  console.log(`   Found ${allMeals.length} recipes`);

  // Process each recipe
  for (const meal of allMeals) {
    try {
      // Check if we have a YouTube video ID
      let youtubeId: string | null = null;
      if (meal.strYoutube) {
        const match = meal.strYoutube.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        youtubeId = match ? match[1] : null;
      }

      // Skip if no YouTube video
      if (!youtubeId) continue;

      // Check if video already exists
      const existing = await prisma.video.findUnique({
        where: { youtubeId },
      });
      if (existing) continue;

      // Create the video
      const video = await prisma.video.create({
        data: {
          youtubeId,
          title: meal.strMeal,
          description: meal.strInstructions?.substring(0, 2000) || null,
          thumbnailUrl: meal.strMealThumb,
          publishedAt: new Date(), // MealDB doesn't provide this
          extractedAt: new Date(),
        },
      });

      // Extract and link ingredients
      const ingredients = extractIngredients(meal);
      for (const ingName of ingredients) {
        if (ingName.length < 2) continue;

        // Ensure ingredient exists
        const ingredient = await prisma.ingredient.upsert({
          where: { name: ingName },
          update: {},
          create: { name: ingName },
        });

        // Link to video
        try {
          await prisma.videoIngredient.create({
            data: {
              videoId: video.id,
              ingredientId: ingredient.id,
              confidence: 0.95, // High confidence since it's from structured data
              source: 'mealdb',
            },
          });
          videoIngredientsCreated++;
        } catch {
          // Skip duplicates
        }
      }

      recipesImported++;
      if (recipesImported % 50 === 0) {
        console.log(`   Progress: ${recipesImported} recipes imported...`);
      }
    } catch (error) {
      // Skip errors, continue with next
    }
  }

  return { recipes: recipesImported, ingredients: ingredientsCreated, videoIngredients: videoIngredientsCreated };
}

// ============================================
// Edamam Recipe Database (requires free API key)
// ============================================

// Note: Edamam requires registration but has a generous free tier
// We'll skip this for now since it requires an API key

// ============================================
// Curated Ingredient Combinations for YouTube Search
// ============================================

async function importCuratedCombinations(): Promise<number> {
  console.log('\n📋 Importing curated ingredient combinations...');

  // These are popular combinations that will generate good YouTube search queries
  const combinations = [
    // Proteins + Popular Ingredients
    ['chicken', 'garlic', 'lemon'],
    ['chicken', 'honey', 'soy sauce'],
    ['chicken', 'mushroom', 'cream'],
    ['chicken', 'spinach', 'feta'],
    ['chicken', 'broccoli', 'garlic'],
    ['salmon', 'lemon', 'dill'],
    ['salmon', 'honey', 'garlic'],
    ['salmon', 'teriyaki'],
    ['salmon', 'miso'],
    ['beef', 'garlic', 'butter'],
    ['beef', 'mushroom', 'onion'],
    ['beef', 'broccoli', 'soy sauce'],
    ['shrimp', 'garlic', 'butter'],
    ['shrimp', 'lemon', 'garlic'],
    ['pork', 'apple', 'sage'],
    ['pork', 'garlic', 'honey'],
    ['tofu', 'sesame', 'soy sauce'],
    ['tofu', 'ginger', 'garlic'],

    // International Cuisines
    ['gochujang', 'chicken'],
    ['gochujang', 'pork'],
    ['miso', 'eggplant'],
    ['miso', 'salmon'],
    ['miso', 'pasta'],
    ['tahini', 'chickpea'],
    ['tahini', 'cauliflower'],
    ['harissa', 'chicken'],
    ['harissa', 'lamb'],
    ['chimichurri', 'steak'],
    ['kimchi', 'fried rice'],
    ['kimchi', 'pork'],
    ['curry', 'chicken'],
    ['curry', 'shrimp'],
    ['curry', 'vegetable'],
    ['tikka masala', 'chicken'],
    ['butter chicken'],
    ['pad thai'],
    ['pho', 'beef'],
    ['ramen', 'pork'],
    ['bibimbap'],
    ['shakshuka'],
    ['falafel'],

    // Pasta Combinations
    ['pasta', 'garlic', 'olive oil'],
    ['pasta', 'tomato', 'basil'],
    ['pasta', 'cream', 'bacon'],
    ['pasta', 'lemon', 'parmesan'],
    ['pasta', 'pesto'],
    ['pasta', 'vodka sauce'],
    ['pasta', 'mushroom', 'cream'],
    ['spaghetti', 'meatball'],
    ['carbonara'],
    ['alfredo'],
    ['lasagna'],
    ['mac and cheese'],

    // Rice & Grains
    ['rice', 'egg', 'soy sauce'],
    ['fried rice', 'shrimp'],
    ['fried rice', 'chicken'],
    ['risotto', 'mushroom'],
    ['risotto', 'seafood'],
    ['quinoa', 'vegetable'],
    ['couscous', 'chicken'],

    // Vegetarian/Vegan
    ['cauliflower', 'buffalo'],
    ['cauliflower', 'curry'],
    ['eggplant', 'parmesan'],
    ['eggplant', 'garlic'],
    ['mushroom', 'garlic', 'butter'],
    ['zucchini', 'parmesan'],
    ['sweet potato', 'black bean'],
    ['chickpea', 'curry'],
    ['lentil', 'soup'],

    // Breakfast
    ['egg', 'bacon', 'cheese'],
    ['pancake', 'maple syrup'],
    ['french toast'],
    ['avocado toast'],
    ['omelette', 'cheese'],
    ['scrambled eggs'],

    // Desserts & Baking
    ['chocolate', 'cake'],
    ['chocolate', 'cookie'],
    ['banana', 'bread'],
    ['apple', 'pie'],
    ['cheesecake'],
    ['brownie'],
    ['cookie', 'butter'],

    // Trending/Viral
    ['air fryer', 'chicken'],
    ['air fryer', 'salmon'],
    ['air fryer', 'potato'],
    ['instant pot', 'chicken'],
    ['instant pot', 'beef'],
    ['one pot', 'pasta'],
    ['sheet pan', 'chicken'],
    ['slow cooker', 'beef'],

    // Sauces & Condiments
    ['sriracha', 'mayo'],
    ['garlic aioli'],
    ['tzatziki'],
    ['hummus'],
    ['guacamole'],
    ['salsa verde'],
    ['peanut sauce'],
    ['teriyaki sauce'],
  ];

  // Store these as search patterns in the database
  let stored = 0;
  for (const combo of combinations) {
    const ingredients = combo.map(i => i.toLowerCase().trim());

    // Ensure all ingredients exist
    for (const name of ingredients) {
      await prisma.ingredient.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }

    // Store as a search record (simulates user searches for query generation)
    try {
      await prisma.search.create({
        data: {
          ingredients,
        },
      });
      stored++;
    } catch {
      // Skip if constraint violation
    }
  }

  console.log(`   ✅ Stored ${stored} curated combinations as search patterns`);
  return stored;
}

// ============================================
// Main Import Function
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const source = args.find(a => a.startsWith('--source='))?.split('=')[1] || 'all';

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📚 Public Recipe Dataset Importer');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Source: ${source}`);
  console.log(`Started at: ${new Date().toISOString()}\n`);

  const startTime = Date.now();
  let totalRecipes = 0;
  let totalIngredients = 0;
  let totalVideoIngredients = 0;
  let totalCombinations = 0;

  try {
    await prisma.$connect();
    console.log('✅ Database connected\n');

    // Import based on source
    if (source === 'all' || source === 'mealdb') {
      const mealdbStats = await importMealDB();
      totalRecipes += mealdbStats.recipes;
      totalIngredients += mealdbStats.ingredients;
      totalVideoIngredients += mealdbStats.videoIngredients;
    }

    if (source === 'all' || source === 'curated') {
      totalCombinations = await importCuratedCombinations();
    }

    // Final summary
    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✨ Import Complete');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Duration: ${duration}s`);
    console.log(`Recipes imported: ${totalRecipes}`);
    console.log(`Ingredients created: ${totalIngredients}`);
    console.log(`Video-ingredient links: ${totalVideoIngredients}`);
    console.log(`Curated combinations: ${totalCombinations}`);

    // Database summary
    const videoCount = await prisma.video.count();
    const ingredientCount = await prisma.ingredient.count();
    const viCount = await prisma.videoIngredient.count();

    console.log('\n📊 Database Totals:');
    console.log(`   Videos: ${videoCount}`);
    console.log(`   Ingredients: ${ingredientCount}`);
    console.log(`   Video-Ingredient links: ${viCount}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
