/**
 * Clean Up False Positive Ingredient Detections
 *
 * Removes low-confidence VideoIngredient records that are likely false positives.
 * Also removes baking/dessert ingredients from savory recipe videos.
 *
 * Usage: npx tsx src/scripts/cleanup-false-positives.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Ingredients that are almost always false positives from keyword matching
// These get detected when descriptions mention other recipes, sponsors, etc.
const LIKELY_FALSE_POSITIVES = [
  'marshmallow',
  'whipped cream',
  'sprinkle',
  'sprinkles',
  'powdered sugar',
  'caramel',
];

async function main() {
  console.log('=== Cleaning Up False Positive Ingredient Detections ===\n');

  // 1. Remove very low confidence detections (< 0.4)
  const lowConfResult = await prisma.videoIngredient.deleteMany({
    where: {
      confidence: { lt: 0.4 },
    },
  });
  console.log(`Removed ${lowConfResult.count} records with confidence < 0.4`);

  // 2. Remove known false-positive ingredients from description source
  for (const fpName of LIKELY_FALSE_POSITIVES) {
    const ingredient = await prisma.ingredient.findUnique({
      where: { name: fpName },
    });

    if (!ingredient) continue;

    // Only remove description-sourced, low-confidence matches
    const result = await prisma.videoIngredient.deleteMany({
      where: {
        ingredientId: ingredient.id,
        source: 'description',
        confidence: { lt: 0.7 },
      },
    });

    if (result.count > 0) {
      console.log(`Removed ${result.count} false-positive "${fpName}" detections from descriptions`);
    }
  }

  // 3. Count remaining records
  const totalRemaining = await prisma.videoIngredient.count();
  console.log(`\nTotal VideoIngredient records remaining: ${totalRemaining}`);

  await prisma.$disconnect();
}

main().catch(console.error);
