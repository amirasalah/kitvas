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
 * 5. Dynamic blocklist from user corrections (ML feedback loop)
 *
 * Week 5 improvements:
 * - Enhanced LLM prompt with stricter instructions and examples
 * - Synonym-aware normalization (e.g., "tomatoes" -> "tomato")
 * - Deduplication after normalization
 *
 * ML Training improvements:
 * - Dynamic blocklist populated from ExtractionFeedback (false positives)
 * - Dynamic allowlist for commonly missed ingredients (false negatives)
 * - Rename mappings from user corrections
 */

import { PrismaClient } from '@prisma/client';
import Groq from 'groq-sdk';
import { normalizeIngredient } from './ingredient-synonyms.js';

// Initialize Groq client (uses GROQ_API_KEY from environment)
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Track if LLM API has failed to avoid spamming logs
let llmApiDisabled = false;

// ============================================================================
// Static Blocklist - Common False Positives
// ============================================================================

/**
 * Static blocklist for terms that should NEVER be extracted as ingredients.
 * These are cooking methods, modifiers, adjectives, and generic terms that
 * are commonly misidentified as ingredients.
 */
const STATIC_BLOCKLIST = new Set([
  // Cooking methods (often appear with ingredients but aren't ingredients)
  'smoked', 'grilled', 'baked', 'fried', 'roasted', 'steamed', 'braised',
  'sauteed', 'sautéed', 'poached', 'blanched', 'marinated', 'fermented',
  'pickled', 'cured', 'dried', 'frozen', 'fresh', 'raw', 'cooked',
  'caramelized', 'charred', 'blackened', 'seared', 'toasted', 'broiled',
  'stir-fried', 'deep-fried', 'pan-fried', 'air-fried', 'slow-cooked',
  'pressure-cooked', 'sous-vide', 'infused', 'stuffed', 'wrapped',

  // Texture/state descriptors
  'crispy', 'creamy', 'crunchy', 'tender', 'soft', 'hard', 'chewy',
  'fluffy', 'smooth', 'thick', 'thin', 'chunky', 'silky', 'velvety',
  'melted', 'shredded', 'sliced', 'diced', 'chopped', 'minced', 'grated',
  'crushed', 'mashed', 'pureed', 'blended', 'whipped', 'beaten',

  // Recipe/video descriptors
  'easy', 'quick', 'simple', 'best', 'delicious', 'homemade', 'instant',
  'viral', 'perfect', 'amazing', 'ultimate', 'healthy', 'tasty', 'yummy',
  'favorite', 'favourite', 'classic', 'traditional', 'authentic', 'secret',
  'famous', 'popular', 'trending', 'new', 'original', 'special',

  // Generic cooking terms
  'recipe', 'recipes', 'video', 'videos', 'food', 'foods', 'meal', 'meals',
  'dish', 'dishes', 'ingredient', 'ingredients', 'cooking', 'cook', 'chef',
  'kitchen', 'homestyle', 'restaurant', 'style', 'version', 'way',

  // Serving/portion terms
  'serving', 'portion', 'piece', 'slice', 'cup', 'tablespoon', 'teaspoon',
  'bowl', 'plate', 'batch', 'bunch',

  // Nationality/ethnicity adjectives (cuisine styles, not ingredients)
  // Note: Some like "korean" can be valid for things like "korean chili flakes"
  // but standalone they're not ingredients
  'ethiopian', 'american', 'british', 'french', 'german', 'spanish',
  'greek', 'turkish', 'lebanese', 'moroccan', 'egyptian', 'african',
  'asian', 'european', 'western', 'eastern', 'southern', 'northern',
  'caribbean', 'hawaiian', 'brazilian', 'peruvian', 'argentinian',
  'australian', 'russian', 'polish', 'hungarian', 'swedish', 'norwegian',

  // Time-related
  'minute', 'minutes', 'hour', 'hours', 'overnight', 'quick', 'fast',
  'slow', 'instant',

  // Equipment that might be misidentified
  'air fryer', 'oven', 'stovetop', 'grill', 'microwave', 'blender',
  'mixer', 'pan', 'pot', 'skillet', 'wok', 'instant pot', 'slow cooker',

  // Common false positives from real data
  'no', 'preservatives', 'housewife', 'cooks', 'shorts', 'subscribe',
]);

// ============================================================================
// Dynamic Blocklist/Allowlist from User Corrections
// ============================================================================

// Items that should NOT be extracted (frequently marked "wrong" by users)
const dynamicBlocklist = new Set<string>();

// Items that should definitely be extracted (frequently added by users)
const dynamicAllowlist = new Set<string>();

// Rename mappings from user corrections
const dynamicRenames = new Map<string, string>();

// Last time the lists were refreshed
let lastFeedbackRefresh: Date | null = null;
const FEEDBACK_REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour

/**
 * Refresh dynamic blocklist/allowlist from ExtractionFeedback table
 * Called periodically to incorporate user corrections into extraction
 */
export async function refreshExtractionFeedback(prisma: PrismaClient): Promise<void> {
  // Skip if recently refreshed
  if (lastFeedbackRefresh && Date.now() - lastFeedbackRefresh.getTime() < FEEDBACK_REFRESH_INTERVAL) {
    return;
  }

  try {
    const feedback = await prisma.extractionFeedback.findMany({
      where: {
        occurrences: { gte: 2 }, // Only patterns with 2+ occurrences
      },
    });

    // Clear and rebuild lists
    dynamicBlocklist.clear();
    dynamicAllowlist.clear();
    dynamicRenames.clear();

    for (const item of feedback) {
      const pattern = item.pattern.toLowerCase();

      if (item.feedbackType === 'false_positive') {
        dynamicBlocklist.add(pattern);
      } else if (item.feedbackType === 'false_negative' && item.correctValue) {
        dynamicAllowlist.add(pattern);
      } else if (item.feedbackType === 'rename' && item.correctValue) {
        dynamicRenames.set(pattern, item.correctValue.toLowerCase());
      }
    }

    lastFeedbackRefresh = new Date();
    console.log(`[Extraction] Refreshed feedback: ${dynamicBlocklist.size} blocked, ${dynamicAllowlist.size} allowlisted, ${dynamicRenames.size} renames`);
  } catch (error) {
    console.warn('[Extraction] Failed to refresh feedback:', error);
  }
}

/**
 * Check if an ingredient should be blocked (false positive)
 * Checks both static blocklist and dynamic blocklist from user corrections
 */
function isBlocked(ingredientName: string): boolean {
  const lower = ingredientName.toLowerCase();
  return STATIC_BLOCKLIST.has(lower) || dynamicBlocklist.has(lower);
}

/**
 * Apply rename mapping if exists
 */
function applyRename(ingredientName: string): string {
  const lower = ingredientName.toLowerCase();
  return dynamicRenames.get(lower) || ingredientName;
}

/**
 * Get blocklist items for LLM prompt enhancement
 */
function getBlocklistForPrompt(): string[] {
  return Array.from(dynamicBlocklist).slice(0, 20); // Limit to top 20
}

export interface ExtractedIngredient {
  name: string;
  confidence: number;
  source: 'title' | 'description' | 'transcript';
}

/**
 * Common ingredient keywords and patterns
 * This is a basic implementation - can be enhanced with ML/NLP later
 */
const INGREDIENT_KEYWORDS = [
  // Proteins
  'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'tofu', 'tempeh',
  'lamb', 'turkey', 'bacon', 'sausage', 'egg', 'eggs',
  // Vegetables
  'tomato', 'onion', 'garlic', 'ginger', 'carrot', 'celery', 'bell pepper', 'mushroom',
  'spinach', 'kale', 'broccoli', 'cauliflower', 'zucchini', 'eggplant', 'potato',
  'cabbage', 'lettuce', 'cucumber', 'avocado', 'corn', 'peas', 'asparagus',
  // Fruits
  'apple', 'banana', 'strawberry', 'blueberry', 'raspberry', 'mango', 'pineapple',
  'peach', 'pear', 'grape', 'cherry', 'watermelon', 'coconut',
  // Herbs & Spices
  'basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro', 'mint', 'dill',
  'cumin', 'coriander', 'paprika', 'turmeric', 'cinnamon', 'nutmeg', 'cloves',
  'vanilla', 'cardamom', 'saffron', 'bay leaf', 'chili', 'pepper',
  // Condiments & Sauces
  'miso', 'gochujang', 'soy sauce', 'tahini', 'harissa', 'sriracha', 'mayonnaise',
  'mustard', 'ketchup', 'vinegar', 'lemon', 'lime', 'orange',
  'honey', 'maple syrup', 'peanut butter', 'nutella',
  // Dairy
  'butter', 'cheese', 'parmesan', 'mozzarella', 'cream', 'milk', 'yogurt',
  'cream cheese', 'ricotta', 'feta', 'cheddar', 'mascarpone',
  // Grains & Starches
  'pasta', 'rice', 'noodles', 'bread', 'flour', 'quinoa', 'couscous',
  'oats', 'oatmeal', 'tortilla', 'ramen',
  // Oils & Fats
  'olive oil', 'coconut oil', 'sesame oil', 'avocado oil', 'vegetable oil',
  // Legumes
  'chickpeas', 'black beans', 'kidney beans', 'lentils', 'edamame',
  // Nuts & Seeds
  'almonds', 'walnuts', 'cashews', 'peanuts', 'sesame seeds', 'pumpkin seeds',
  'hazelnuts', 'pecans', 'pistachios', 'chia seeds', 'flax seeds',
  // Sweets & Baking
  'chocolate', 'cocoa', 'sugar', 'brown sugar', 'powdered sugar',
  'caramel', 'marshmallow', 'whipped cream', 'sprinkles',
  // Other
  'kimchi', 'sauerkraut', 'pickles', 'capers', 'olives', 'sun-dried tomatoes',
  'nutritional yeast', 'coconut milk', 'cashew cream', 'tofu', 'seitan',
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

  // Build dynamic blocklist section for prompt
  const blocklist = getBlocklistForPrompt();
  const blocklistSection = blocklist.length > 0
    ? `\n10. NEVER extract these (commonly misidentified as ingredients): ${blocklist.join(', ')}.`
    : '';

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
6. EXCLUDE equipment: air fryer, oven, pan, pot, blender, instant pot, slow cooker, microwave.
7. EXCLUDE cooking methods and modifiers: smoked, grilled, baked, fried, roasted, steamed, braised, sautéed, caramelized, crispy, creamy, crunchy, marinated, fermented, pickled, cured, dried, fresh, raw.
8. EXCLUDE adjectives and descriptors: easy, quick, best, delicious, homemade, viral, perfect, healthy, traditional, authentic.
9. EXCLUDE generic terms: recipe, video, food, meal, dish, ingredients, cooking, style.
10. EXCLUDE nationality adjectives when used to describe cuisine style (not ingredients): ethiopian, korean, japanese, indian, italian, mexican, etc.
11. For compound condiments (e.g., "soy sauce", "olive oil", "fish sauce"), keep them as one item.
12. If the title says "Miso Pasta Recipe", extract "miso" and "pasta" separately.
13. Only extract ingredients actually mentioned, do not infer or guess.${blocklistSection}`
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

      // Skip blocklisted items
      if (isBlocked(name)) {
        continue;
      }

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
 * Also applies dynamic rename mappings from user corrections
 */
function normalizeIngredientName(name: string): string {
  // First apply user-corrected renames
  const renamed = applyRename(name);
  // Then apply standard normalization
  return normalizeIngredient(renamed);
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

  // Filter out blocklisted items
  const filtered = Array.from(extracted.values()).filter(ing => !isBlocked(ing.name));
  return filtered;
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
 * Extract ingredients from transcript using LLM
 * Transcripts are longer, so we use LLM-only extraction (keywords less effective)
 */
async function extractFromTranscript(
  transcript: string
): Promise<ExtractedIngredient[]> {
  // Truncate very long transcripts to avoid token limits (keep first ~4000 chars)
  const truncated = transcript.length > 4000 ? transcript.substring(0, 4000) + '...' : transcript;

  const llmResult = await extractWithLLM('Video transcript', truncated);
  if (llmResult && llmResult.length > 0) {
    // Mark source as 'transcript' with slightly lower confidence
    return llmResult.map(ing => ({
      ...ing,
      source: 'transcript' as const,
      confidence: Math.min(ing.confidence, 0.80), // Cap at 0.80 for transcript
    }));
  }
  return [];
}

// Prisma client for feedback refresh - set via initExtractor()
let prismaClient: PrismaClient | null = null;

/**
 * Initialize the extractor with a Prisma client for feedback refresh
 * Call this once at startup to enable dynamic feedback
 */
export function initExtractor(prisma: PrismaClient): void {
  prismaClient = prisma;
  // Immediately load feedback on init
  refreshExtractionFeedback(prisma).catch(err =>
    console.warn('[Extraction] Failed to load initial feedback:', err)
  );
}

/**
 * Extract ingredients from video metadata (and optionally transcript)
 * Uses Groq LLM for intelligent extraction, falls back to keyword matching
 *
 * @param title Video title
 * @param description Video description (optional)
 * @param transcript Video transcript (optional) - fetched from youtube-transcript
 */
export async function extractIngredientsFromVideo(
  title: string,
  description: string | null,
  transcript?: string | null
): Promise<ExtractedIngredient[]> {
  // Refresh feedback lists if needed (has 1-hour cache)
  if (prismaClient) {
    await refreshExtractionFeedback(prismaClient);
  }

  // Collect all ingredients in a map (keyed by name for deduplication)
  const ingredients = new Map<string, ExtractedIngredient>();

  // 1. Try LLM extraction from title/description first (Groq with Llama 3.3)
  const llmResult = await extractWithLLM(title, description);
  if (llmResult && llmResult.length > 0) {
    console.log(`  [Groq] Extracted ${llmResult.length} ingredients from metadata`);
    for (const ing of llmResult) {
      ingredients.set(ing.name, ing);
    }
  } else {
    // Fall back to keyword matching for title/description
    const keywordResult = extractIngredientsWithKeywords(title, description);
    console.log(`  [Keywords] Extracted ${keywordResult.length} ingredients from metadata`);
    for (const ing of keywordResult) {
      ingredients.set(ing.name, ing);
    }
  }

  // 2. Extract from transcript if available (adds ingredients not found in metadata)
  if (transcript && transcript.length > 50) {
    const transcriptIngredients = await extractFromTranscript(transcript);
    if (transcriptIngredients.length > 0) {
      console.log(`  [Transcript] Extracted ${transcriptIngredients.length} ingredients`);
      for (const ing of transcriptIngredients) {
        // Only add if not already found (title/description have priority)
        if (!ingredients.has(ing.name)) {
          ingredients.set(ing.name, ing);
        }
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
