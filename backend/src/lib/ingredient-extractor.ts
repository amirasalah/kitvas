/**
 * Ingredient Extraction Module
 *
 * Extracts ingredients from video metadata (title, description).
 * This runs during batch pre-crawling to extract all ingredients upfront.
 *
 * Strategy:
 * 1. Use Groq LLM for intelligent ingredient extraction (primary)
 * 2. Fall back to keyword-based extraction if API fails
 * 3. Normalize ingredient names using synonym mapping (Week 5)
 * 4. Store with confidence scores
 *
 * Week 5 improvements:
 * - Enhanced LLM prompt with stricter instructions and examples
 * - Synonym-aware normalization (e.g., "tomatoes" -> "tomato")
 * - Deduplication after normalization
 */

import { PrismaClient } from '@prisma/client';
import Groq from 'groq-sdk';
import { normalizeIngredient } from './ingredient-synonyms.js';

// Initialize Groq client (uses GROQ_API_KEY from environment)
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Track if LLM API has failed to avoid spamming logs
let llmApiDisabled = false;

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
 * Extract ingredients using Groq API (free tier available)
 * Uses Llama 3.3 70B model for intelligent extraction
 */
async function extractWithLLM(
  title: string,
  description: string | null
): Promise<ExtractedIngredient[] | null> {
  // Skip if no API key configured or API has been disabled due to errors
  if (!groq || llmApiDisabled) {
    return null;
  }

  const text = description ? `Title: ${title}\n\nDescription: ${description}` : `Title: ${title}`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a food ingredient extraction system. You extract ONLY actual food ingredients from cooking video metadata. You return structured JSON.

RULES:
1. Return ONLY a JSON array. No explanation, no markdown.
2. Each item has "name" (lowercase, singular, canonical form) and "source" ("title" or "description").
3. Use singular canonical forms: "tomato" not "tomatoes", "chicken" not "chickens", "almond" not "almonds".
4. Extract specific ingredients, not dishes: "pasta" and "miso" not "miso pasta".
5. Include: proteins, vegetables, fruits, herbs, spices, condiments, sauces, grains, dairy, oils, nuts, seeds, sweeteners.
6. EXCLUDE: equipment (air fryer, oven), methods (baked, fried, grilled), dish names (stir fry, curry), serving suggestions, generic terms (recipe, ingredients, food), non-food items.
7. For compound condiments (e.g., "soy sauce", "olive oil", "fish sauce"), keep them as one item.
8. If the title says "Miso Pasta Recipe", extract "miso" and "pasta" separately.
9. Only extract ingredients actually mentioned, do not infer or guess.`
        },
        {
          role: 'user',
          content: `Extract food ingredients from this cooking video:

${text}

JSON array:`
        }
      ],
      temperature: 0.1,
      max_tokens: 1024,
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      return null;
    }

    // Clean up response - sometimes LLMs add markdown code blocks
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(jsonStr) as Array<{ name: string; source: 'title' | 'description' }>;

    // Convert to ExtractedIngredient format with confidence scores
    // Deduplicate after normalization (e.g., "tomato" and "tomatoes" -> same)
    const deduped = new Map<string, ExtractedIngredient>();
    for (const item of parsed) {
      const name = normalizeIngredientName(item.name);
      const confidence = item.source === 'title' ? 0.95 : 0.85;
      const existing = deduped.get(name);
      if (!existing || confidence > existing.confidence) {
        deduped.set(name, { name, confidence, source: item.source });
      }
    }
    return Array.from(deduped.values());
  } catch (error) {
    // Disable LLM API for this session to avoid spamming failed requests
    llmApiDisabled = true;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('⚠️  Groq API unavailable - using keyword extraction for this session:', errorMessage);
    return null;
  }
}

/**
 * Normalize ingredient name using synonym mapping (Week 5)
 * Delegates to the comprehensive synonym-based normalizer
 */
function normalizeIngredientName(name: string): string {
  return normalizeIngredient(name);
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
 * Extract ingredients from video metadata using keyword matching only
 * Used as fallback when Claude API is unavailable
 */
export function extractIngredientsWithKeywords(
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
 * Extract ingredients from video metadata
 * Uses Claude API for intelligent extraction, falls back to keyword matching
 */
export async function extractIngredientsFromVideo(
  title: string,
  description: string | null
): Promise<ExtractedIngredient[]> {
  // Try LLM extraction first (Groq with Llama 3.3)
  const llmResult = await extractWithLLM(title, description);
  if (llmResult && llmResult.length > 0) {
    console.log(`  [Groq] Extracted ${llmResult.length} ingredients`);
    return llmResult;
  }

  // Fall back to keyword matching
  const keywordResult = extractIngredientsWithKeywords(title, description);
  console.log(`  [Keywords] Extracted ${keywordResult.length} ingredients`);
  return keywordResult;
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
    // Extract ingredients (uses Claude API with keyword fallback)
    const extracted = await extractIngredientsFromVideo(title, description);

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
