/**
 * Tag Extraction Module
 *
 * Week 5: ML Models & Improvement
 *
 * Detects tags from video metadata:
 * - Cooking methods (air fryer, oven, stovetop, instant pot, etc.)
 * - Dietary tags (vegan, vegetarian, gluten-free, keto, etc.)
 * - Cuisine tags (korean, japanese, italian, mexican, etc.)
 */

import { PrismaClient } from '@prisma/client';
import Groq from 'groq-sdk';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export interface ExtractedTag {
  tag: string;
  category: 'cooking_method' | 'dietary' | 'cuisine';
  confidence: number;
}

// ── Keyword-based tag dictionaries ──────────────────────────────────────────

const COOKING_METHOD_KEYWORDS: Record<string, string[]> = {
  'air fryer': ['air fryer', 'air fried', 'airfryer', 'air-fryer', 'air fry'],
  'oven': ['oven', 'baked', 'bake', 'roasted', 'roast'],
  'stovetop': ['stovetop', 'stove top', 'pan fried', 'pan-fried', 'sauteed', 'sauté', 'saute', 'stir fry', 'stir-fry', 'stir fried'],
  'slow cooker': ['slow cooker', 'crockpot', 'crock pot', 'crock-pot', 'slow cooked'],
  'instant pot': ['instant pot', 'instapot', 'pressure cooker', 'pressure cook'],
  'grill': ['grill', 'grilled', 'grilling', 'bbq', 'barbecue', 'chargrilled'],
  'deep fry': ['deep fried', 'deep fry', 'deep-fried'],
  'microwave': ['microwave', 'microwaved'],
  'no cook': ['no cook', 'no-cook', 'raw', 'no bake', 'no-bake'],
  'sous vide': ['sous vide', 'sous-vide'],
  'steamed': ['steamed', 'steam', 'steaming'],
  'smoked': ['smoked', 'smoking', 'smoke'],
  'one pot': ['one pot', 'one-pot', 'one pan', 'one-pan', 'sheet pan', 'sheet-pan'],
};

const DIETARY_KEYWORDS: Record<string, string[]> = {
  'vegan': ['vegan', 'plant based', 'plant-based'],
  'vegetarian': ['vegetarian', 'meatless', 'meat-free', 'meat free'],
  'gluten-free': ['gluten free', 'gluten-free', 'no gluten'],
  'dairy-free': ['dairy free', 'dairy-free', 'no dairy'],
  'keto': ['keto', 'ketogenic', 'low carb', 'low-carb'],
  'paleo': ['paleo', 'paleolithic'],
  'whole30': ['whole30', 'whole 30'],
  'low calorie': ['low calorie', 'low-calorie'],
  'high protein': ['high protein', 'high-protein', 'protein rich', 'protein-rich'],
  'sugar-free': ['sugar free', 'sugar-free', 'no sugar', 'zero sugar'],
  'nut-free': ['nut free', 'nut-free', 'no nuts'],
};

const CUISINE_KEYWORDS: Record<string, string[]> = {
  'korean': ['korean', 'k-food', 'gochujang', 'kimchi', 'bibimbap', 'bulgogi', 'tteokbokki'],
  'japanese': ['japanese', 'ramen', 'sushi', 'teriyaki', 'udon', 'soba', 'tempura', 'katsu'],
  'chinese': ['chinese', 'dim sum', 'kung pao', 'szechuan', 'sichuan', 'cantonese'],
  'thai': ['thai', 'pad thai', 'green curry', 'red curry', 'tom yum', 'tom kha'],
  'indian': ['indian', 'tikka', 'masala', 'biryani', 'tandoori', 'dal', 'paneer'],
  'italian': ['italian', 'risotto', 'bruschetta', 'carbonara', 'bolognese', 'pesto'],
  'mexican': ['mexican', 'taco', 'tacos', 'burrito', 'enchilada', 'quesadilla', 'guacamole'],
  'mediterranean': ['mediterranean', 'hummus', 'falafel', 'shawarma', 'tzatziki', 'tabbouleh'],
  'french': ['french', 'ratatouille', 'soufflé', 'souffle', 'crêpe', 'crepe', 'quiche', 'béarnaise'],
  'american': ['american', 'mac and cheese', 'cajun', 'southern'],
  'middle eastern': ['middle eastern', 'lebanese', 'turkish', 'persian', 'israeli', 'shakshuka', 'baba ganoush'],
  'vietnamese': ['vietnamese', 'pho', 'banh mi'],
  'greek': ['greek', 'souvlaki', 'gyro', 'moussaka'],
  'spanish': ['spanish', 'paella', 'tapas', 'gazpacho'],
  'ethiopian': ['ethiopian', 'injera', 'berbere'],
  'caribbean': ['caribbean', 'jerk', 'jamaican'],
  'filipino': ['filipino', 'pinoy', 'adobo', 'sinigang', 'lechon', 'lumpia', 'pancit', 'kare-kare', 'kare kare', 'sisig', 'banana ketchup', 'tocino', 'longganisa', 'tinola', 'caldereta'],
  'indonesian': ['indonesian', 'nasi goreng', 'satay', 'rendang', 'gado-gado', 'gado gado', 'sambal'],
  'malaysian': ['malaysian', 'laksa', 'nasi lemak', 'char kway teow'],
  'singaporean': ['singaporean', 'hainanese', 'chili crab'],
  'brazilian': ['brazilian', 'feijoada', 'churrasco', 'picanha', 'pão de queijo'],
  'peruvian': ['peruvian', 'ceviche', 'lomo saltado', 'anticucho'],
  'moroccan': ['moroccan', 'tagine', 'couscous', 'harira'],
};

// Build set of all valid tags for LLM validation
const ALL_VALID_TAGS: Set<string> = new Set([
  ...Object.keys(COOKING_METHOD_KEYWORDS),
  ...Object.keys(DIETARY_KEYWORDS),
  ...Object.keys(CUISINE_KEYWORDS),
]);

/**
 * Check if a keyword matches in text using word boundaries.
 * Prevents substring false positives like "wat" matching "what".
 */
function matchesKeyword(text: string, keyword: string): boolean {
  // Multi-word keywords are specific enough for includes()
  if (keyword.includes(' ') || keyword.includes('-')) {
    return text.includes(keyword);
  }
  // Single-word keywords need word boundary matching
  const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
  return regex.test(text);
}

/**
 * Extract tags from video metadata using keyword matching
 */
export function extractTagsWithKeywords(
  title: string,
  description: string | null
): ExtractedTag[] {
  const titleLower = title.toLowerCase();
  const text = `${titleLower} ${(description || '').toLowerCase()}`;
  const tags: Map<string, ExtractedTag> = new Map();

  const checkKeywords = (
    dict: Record<string, string[]>,
    category: ExtractedTag['category']
  ) => {
    for (const [tag, keywords] of Object.entries(dict)) {
      for (const kw of keywords) {
        if (matchesKeyword(text, kw)) {
          const inTitle = matchesKeyword(titleLower, kw);
          const confidence = inTitle ? 0.9 : 0.7;
          const existing = tags.get(tag);
          if (!existing || confidence > existing.confidence) {
            tags.set(tag, { tag, category, confidence });
          }
          break; // Found one keyword match for this tag, move on
        }
      }
    }
  };

  checkKeywords(COOKING_METHOD_KEYWORDS, 'cooking_method');
  checkKeywords(DIETARY_KEYWORDS, 'dietary');
  checkKeywords(CUISINE_KEYWORDS, 'cuisine');

  return Array.from(tags.values());
}

/**
 * Extract tags using Groq LLM
 */
export async function extractTagsWithLLM(
  title: string,
  description: string | null
): Promise<ExtractedTag[] | null> {
  if (!groq) return null;

  const text = description
    ? `Title: ${title}\n\nDescription: ${description}`
    : `Title: ${title}`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a cooking video tag classifier. Given a video title and description, identify relevant tags in these categories:

1. cooking_method: How the food is cooked (e.g., "air fryer", "oven", "stovetop", "grill", "slow cooker", "instant pot", "no cook", "one pot", "steamed", "smoked", "sous vide", "deep fry", "microwave")
2. dietary: Dietary classifications (e.g., "vegan", "vegetarian", "gluten-free", "dairy-free", "keto", "paleo", "high protein", "low calorie", "sugar-free")
3. cuisine: Cuisine type (e.g., "korean", "japanese", "chinese", "thai", "indian", "italian", "mexican", "mediterranean", "french", "american", "vietnamese", "greek", "filipino", "indonesian", "malaysian", "brazilian", "peruvian", "moroccan")

Return ONLY a JSON array. Each item: {"tag": "lowercase tag", "category": "cooking_method"|"dietary"|"cuisine"}.
Only include tags clearly indicated in the text. Do not guess.`
        },
        {
          role: 'user',
          content: `${text}\n\nJSON array:`
        }
      ],
      temperature: 0.1,
      max_tokens: 512,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(jsonStr) as Array<{ tag: string; category: string }>;

    const validCategories = new Set(['cooking_method', 'dietary', 'cuisine']);
    return parsed
      .filter((item) => validCategories.has(item.category))
      .map((item) => ({
        tag: item.tag.toLowerCase().trim(),
        category: item.category as ExtractedTag['category'],
        confidence: 0.85,
      }))
      .filter((item) => ALL_VALID_TAGS.has(item.tag));
  } catch {
    // Fall through to keyword extraction
    return null;
  }
}

/**
 * Extract tags from video metadata
 * Uses LLM first, falls back to keyword matching
 */
export async function extractTagsFromVideo(
  title: string,
  description: string | null
): Promise<ExtractedTag[]> {
  // Try LLM extraction first
  const llmResult = await extractTagsWithLLM(title, description);
  if (llmResult && llmResult.length > 0) {
    // Merge with keyword results for better coverage
    const keywordResult = extractTagsWithKeywords(title, description);
    const merged = new Map<string, ExtractedTag>();
    for (const tag of [...keywordResult, ...llmResult]) {
      const existing = merged.get(tag.tag);
      if (!existing || tag.confidence > existing.confidence) {
        merged.set(tag.tag, tag);
      }
    }
    return Array.from(merged.values());
  }

  // Fall back to keyword matching
  return extractTagsWithKeywords(title, description);
}

/**
 * Store extracted tags in database
 */
export async function storeExtractedTags(
  prisma: PrismaClient,
  videoId: string,
  tags: ExtractedTag[]
): Promise<void> {
  for (const tag of tags) {
    try {
      await prisma.videoTag.upsert({
        where: {
          videoId_tag: { videoId, tag: tag.tag },
        },
        update: {
          confidence: tag.confidence,
          category: tag.category,
        },
        create: {
          videoId,
          tag: tag.tag,
          category: tag.category,
          confidence: tag.confidence,
        },
      });
    } catch (error) {
      console.warn(`Failed to store tag "${tag.tag}" for video ${videoId}:`, error);
    }
  }
}
