/**
 * Ingredient Extraction Module
 * 
 * Extracts ingredients from video metadata (title, description).
 * This runs during batch pre-crawling to extract all ingredients upfront.
 * 
 * Strategy:
 * 1. Extract from title (highest confidence)
 * 2. Extract from description (medium confidence)
 * 3. Normalize ingredient names
 * 4. Store with confidence scores
 */

import { PrismaClient } from '@prisma/client';

export interface ExtractedIngredient {
  name: string;
  confidence: number;
  source: 'title' | 'description';
}

/**
 * Common ingredient keywords and patterns
 * This is a basic implementation - can be enhanced with ML/NLP later
 */
const INGREDIENT_KEYWORDS = [
  // Proteins
  'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'tofu', 'tempeh',
  // Vegetables
  'tomato', 'onion', 'garlic', 'ginger', 'carrot', 'celery', 'bell pepper', 'mushroom',
  'spinach', 'kale', 'broccoli', 'cauliflower', 'zucchini', 'eggplant', 'potato',
  // Herbs & Spices
  'basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro', 'mint', 'dill',
  'cumin', 'coriander', 'paprika', 'turmeric', 'cinnamon', 'nutmeg', 'cloves',
  // Condiments & Sauces
  'miso', 'gochujang', 'soy sauce', 'tahini', 'harissa', 'sriracha', 'mayonnaise',
  'mustard', 'ketchup', 'vinegar', 'lemon', 'lime', 'orange',
  // Dairy
  'butter', 'cheese', 'parmesan', 'mozzarella', 'cream', 'milk', 'yogurt',
  // Grains & Starches
  'pasta', 'rice', 'noodles', 'bread', 'flour', 'quinoa', 'couscous',
  // Oils & Fats
  'olive oil', 'coconut oil', 'sesame oil', 'avocado oil', 'vegetable oil',
  // Legumes
  'chickpeas', 'black beans', 'kidney beans', 'lentils', 'edamame',
  // Nuts & Seeds
  'almonds', 'walnuts', 'cashews', 'peanuts', 'sesame seeds', 'pumpkin seeds',
  // Other
  'kimchi', 'sauerkraut', 'pickles', 'capers', 'olives', 'sun-dried tomatoes',
  'nutritional yeast', 'coconut milk', 'cashew cream',
];

/**
 * Normalize ingredient name
 * Converts to lowercase, handles plurals, removes extra spaces
 */
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/s$/, '') // Remove trailing 's' (basic plural handling)
    .trim();
}

/**
 * Extract ingredients from text
 * Uses keyword matching - can be enhanced with ML/NLP
 */
function extractIngredientsFromText(
  text: string,
  source: 'title' | 'description',
  minConfidence: number = 0.3
): ExtractedIngredient[] {
  if (!text) return [];

  const textLower = text.toLowerCase();
  const extracted: Map<string, ExtractedIngredient> = new Map();

  // Check each ingredient keyword
  for (const keyword of INGREDIENT_KEYWORDS) {
    const keywordLower = keyword.toLowerCase();
    
    // Check if keyword appears in text
    if (textLower.includes(keywordLower)) {
      const normalized = normalizeIngredientName(keyword);
      
      // Calculate confidence based on:
      // - Source (title = higher confidence)
      // - Exact match vs partial match
      // - Word boundaries (exact word = higher confidence)
      let confidence = source === 'title' ? 0.8 : 0.5;
      
      // Check for exact word match (higher confidence)
      const wordBoundaryRegex = new RegExp(`\\b${keywordLower}\\b`, 'i');
      if (wordBoundaryRegex.test(text)) {
        confidence += 0.1;
      } else {
        // Partial match (lower confidence)
        confidence -= 0.2;
      }
      
      // Boost confidence if it's a multi-word ingredient that matches exactly
      if (keyword.split(' ').length > 1 && textLower.includes(keywordLower)) {
        confidence += 0.1;
      }

      confidence = Math.min(1.0, Math.max(minConfidence, confidence));

      // Keep highest confidence if ingredient appears multiple times
      const existing = extracted.get(normalized);
      if (!existing || confidence > existing.confidence) {
        extracted.set(normalized, {
          name: normalized,
          confidence,
          source,
        });
      }
    }
  }

  return Array.from(extracted.values());
}

/**
 * Extract ingredients from video metadata
 * Combines extraction from title and description
 */
export function extractIngredientsFromVideo(
  title: string,
  description: string | null
): ExtractedIngredient[] {
  const ingredients: Map<string, ExtractedIngredient> = new Map();

  // Extract from title (higher priority)
  const titleIngredients = extractIngredientsFromText(title, 'title', 0.5);
  for (const ing of titleIngredients) {
    ingredients.set(ing.name, ing);
  }

  // Extract from description (lower priority, but can add new ingredients)
  if (description) {
    const descIngredients = extractIngredientsFromText(description, 'description', 0.3);
    for (const ing of descIngredients) {
      // Only add if not already found in title, or if description has higher confidence
      const existing = ingredients.get(ing.name);
      if (!existing || ing.confidence > existing.confidence) {
        ingredients.set(ing.name, ing);
      }
    }
  }

  return Array.from(ingredients.values());
}

/**
 * Store extracted ingredients in database
 * Creates ingredients if they don't exist, links to video
 */
export async function storeExtractedIngredients(
  prisma: PrismaClient,
  videoId: string,
  extractedIngredients: ExtractedIngredient[]
): Promise<void> {
  if (extractedIngredients.length === 0) {
    return;
  }

  for (const extracted of extractedIngredients) {
    try {
      // Find or create ingredient
      const ingredient = await prisma.ingredient.upsert({
        where: { name: extracted.name },
        update: {},
        create: {
          name: extracted.name,
          synonyms: [],
        },
      });

      // Link ingredient to video
      await prisma.videoIngredient.upsert({
        where: {
          videoId_ingredientId: {
            videoId,
            ingredientId: ingredient.id,
          },
        },
        update: {
          confidence: extracted.confidence,
          source: extracted.source,
        },
        create: {
          videoId,
          ingredientId: ingredient.id,
          confidence: extracted.confidence,
          source: extracted.source,
        },
      });
    } catch (error) {
      // Log but don't fail - individual ingredient errors shouldn't stop the process
      console.warn(`Failed to store ingredient "${extracted.name}" for video ${videoId}:`, error);
    }
  }
}

/**
 * Process a single video: extract and store ingredients
 * This is called during batch ingestion
 */
export async function processVideoIngredients(
  prisma: PrismaClient,
  videoId: string,
  title: string,
  description: string | null
): Promise<number> {
  try {
    // Extract ingredients
    const extracted = extractIngredientsFromVideo(title, description);

    if (extracted.length === 0) {
      return 0;
    }

    // Store in database
    await storeExtractedIngredients(prisma, videoId, extracted);

    return extracted.length;
  } catch (error) {
    console.error(`Failed to process ingredients for video ${videoId}:`, error);
    return 0;
  }
}
