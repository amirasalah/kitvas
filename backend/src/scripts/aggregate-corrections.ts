/**
 * Correction Aggregation Script
 *
 * Analyzes user corrections to identify extraction patterns that need improvement.
 * Populates ExtractionFeedback table with:
 * - false_positive: Ingredients frequently marked as "wrong"
 * - false_negative: Ingredients frequently added by users
 * - rename: Ingredient name corrections
 *
 * Run weekly to update extraction improvement signals.
 *
 * Usage:
 *   npx tsx src/scripts/aggregate-corrections.ts
 *   npx tsx src/scripts/aggregate-corrections.ts --min-occurrences=5
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function aggregateFalsePositives(minOccurrences: number): Promise<number> {
  console.log('\n--- Aggregating False Positives ---');
  console.log('(Ingredients frequently marked as "wrong")');

  // Find ingredients that users frequently mark as wrong
  const wrongCorrections = await prisma.correction.groupBy({
    by: ['ingredientId'],
    where: { action: 'wrong' },
    _count: { id: true },
    having: {
      id: { _count: { gte: minOccurrences } },
    },
    orderBy: { _count: { id: 'desc' } },
  });

  if (wrongCorrections.length === 0) {
    console.log('  No significant false positives found');
    return 0;
  }

  // Get ingredient names
  const ingredientIds = wrongCorrections.map((c) => c.ingredientId);
  const ingredients = await prisma.ingredient.findMany({
    where: { id: { in: ingredientIds } },
    select: { id: true, name: true },
  });

  const idToName = new Map(ingredients.map((i) => [i.id, i.name]));

  // Upsert feedback entries
  let created = 0;
  for (const correction of wrongCorrections) {
    const name = idToName.get(correction.ingredientId);
    if (!name) continue;

    await prisma.extractionFeedback.upsert({
      where: {
        pattern_feedbackType: {
          pattern: name,
          feedbackType: 'false_positive',
        },
      },
      update: {
        occurrences: correction._count.id,
      },
      create: {
        pattern: name,
        feedbackType: 'false_positive',
        correctValue: null, // Should not be extracted
        occurrences: correction._count.id,
      },
    });

    console.log(`  "${name}": ${correction._count.id} times marked wrong`);
    created++;
  }

  return created;
}

async function aggregateFalseNegatives(minOccurrences: number): Promise<number> {
  console.log('\n--- Aggregating False Negatives ---');
  console.log('(Ingredients frequently added by users)');

  // Find ingredients that users frequently add (they were missing)
  const addCorrections = await prisma.correction.groupBy({
    by: ['ingredientId'],
    where: { action: 'add' },
    _count: { id: true },
    having: {
      id: { _count: { gte: minOccurrences } },
    },
    orderBy: { _count: { id: 'desc' } },
  });

  if (addCorrections.length === 0) {
    console.log('  No significant false negatives found');
    return 0;
  }

  // Get ingredient names
  const ingredientIds = addCorrections.map((c) => c.ingredientId);
  const ingredients = await prisma.ingredient.findMany({
    where: { id: { in: ingredientIds } },
    select: { id: true, name: true },
  });

  const idToName = new Map(ingredients.map((i) => [i.id, i.name]));

  // Upsert feedback entries
  let created = 0;
  for (const correction of addCorrections) {
    const name = idToName.get(correction.ingredientId);
    if (!name) continue;

    await prisma.extractionFeedback.upsert({
      where: {
        pattern_feedbackType: {
          pattern: name,
          feedbackType: 'false_negative',
        },
      },
      update: {
        occurrences: correction._count.id,
      },
      create: {
        pattern: name,
        feedbackType: 'false_negative',
        correctValue: name, // Should be extracted
        occurrences: correction._count.id,
      },
    });

    console.log(`  "${name}": ${correction._count.id} times added by users`);
    created++;
  }

  return created;
}

async function aggregateRenames(minOccurrences: number): Promise<number> {
  console.log('\n--- Aggregating Renames ---');
  console.log('(Ingredient name corrections)');

  // Find rename corrections with suggested names
  const renameCorrections = await prisma.correction.findMany({
    where: {
      action: 'rename',
      suggestedName: { not: null },
    },
    include: {
      ingredient: { select: { name: true } },
    },
  });

  if (renameCorrections.length === 0) {
    console.log('  No rename corrections found');
    return 0;
  }

  // Group by original name -> suggested name
  const renameMap = new Map<string, Map<string, number>>();
  for (const correction of renameCorrections) {
    const original = correction.ingredient.name;
    const suggested = correction.suggestedName!.toLowerCase().trim();

    if (!renameMap.has(original)) {
      renameMap.set(original, new Map());
    }
    const suggestions = renameMap.get(original)!;
    suggestions.set(suggested, (suggestions.get(suggested) || 0) + 1);
  }

  // Find most common suggestion for each original name
  let created = 0;
  for (const [original, suggestions] of renameMap) {
    // Find the most suggested name
    let topSuggestion = '';
    let topCount = 0;
    for (const [suggested, count] of suggestions) {
      if (count > topCount) {
        topSuggestion = suggested;
        topCount = count;
      }
    }

    if (topCount < minOccurrences) continue;

    await prisma.extractionFeedback.upsert({
      where: {
        pattern_feedbackType: {
          pattern: original,
          feedbackType: 'rename',
        },
      },
      update: {
        correctValue: topSuggestion,
        occurrences: topCount,
      },
      create: {
        pattern: original,
        feedbackType: 'rename',
        correctValue: topSuggestion,
        occurrences: topCount,
      },
    });

    console.log(`  "${original}" → "${topSuggestion}": ${topCount} times`);
    created++;
  }

  return created;
}

async function generatePromptSuggestions(): Promise<void> {
  console.log('\n--- Prompt Improvement Suggestions ---');

  // Get unincorporated feedback
  const feedback = await prisma.extractionFeedback.findMany({
    where: { incorporated: false, occurrences: { gte: 3 } },
    orderBy: { occurrences: 'desc' },
  });

  if (feedback.length === 0) {
    console.log('  No unincorporated feedback with 3+ occurrences');
    return;
  }

  const falsePositives = feedback.filter((f) => f.feedbackType === 'false_positive');
  const falseNegatives = feedback.filter((f) => f.feedbackType === 'false_negative');
  const renames = feedback.filter((f) => f.feedbackType === 'rename');

  if (falsePositives.length > 0) {
    console.log('\n  Add to blocklist (DO NOT extract):');
    for (const fp of falsePositives.slice(0, 10)) {
      console.log(`    - "${fp.pattern}" (${fp.occurrences} corrections)`);
    }
  }

  if (falseNegatives.length > 0) {
    console.log('\n  Add to keyword list (MAKE SURE to detect):');
    for (const fn of falseNegatives.slice(0, 10)) {
      console.log(`    - "${fn.pattern}" (${fn.occurrences} corrections)`);
    }
  }

  if (renames.length > 0) {
    console.log('\n  Add to synonym map:');
    for (const r of renames.slice(0, 10)) {
      console.log(`    - "${r.pattern}" → "${r.correctValue}" (${r.occurrences} corrections)`);
    }
  }
}

async function printStats(): Promise<void> {
  console.log('\n--- Current Feedback Stats ---');

  const stats = await prisma.extractionFeedback.groupBy({
    by: ['feedbackType', 'incorporated'],
    _count: { id: true },
    _sum: { occurrences: true },
  });

  for (const stat of stats) {
    const status = stat.incorporated ? 'incorporated' : 'pending';
    console.log(`  ${stat.feedbackType} (${status}): ${stat._count.id} patterns, ${stat._sum.occurrences} total occurrences`);
  }
}

async function main(): Promise<void> {
  console.log('=== Correction Aggregation Script ===');
  console.log(`Started at: ${new Date().toISOString()}`);

  const args = process.argv.slice(2);
  const minArg = args.find((a) => a.startsWith('--min-occurrences='));
  const minOccurrences = minArg ? parseInt(minArg.split('=')[1], 10) : 2;

  console.log(`Minimum occurrences threshold: ${minOccurrences}`);

  try {
    // Get total corrections
    const totalCorrections = await prisma.correction.count();
    console.log(`\nTotal corrections in database: ${totalCorrections}`);

    if (totalCorrections === 0) {
      console.log('No corrections to aggregate yet.');
      return;
    }

    // Aggregate each type
    const fpCount = await aggregateFalsePositives(minOccurrences);
    const fnCount = await aggregateFalseNegatives(minOccurrences);
    const renameCount = await aggregateRenames(minOccurrences);

    console.log(`\n--- Summary ---`);
    console.log(`  False positives identified: ${fpCount}`);
    console.log(`  False negatives identified: ${fnCount}`);
    console.log(`  Renames identified: ${renameCount}`);

    // Print suggestions
    await generatePromptSuggestions();

    // Print current stats
    await printStats();

    console.log('\n✓ Correction aggregation complete');
  } catch (error) {
    console.error('Error during aggregation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
