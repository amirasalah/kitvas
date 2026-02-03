/**
 * Migrate Synonym Map to Database
 *
 * Usage: npx tsx scripts/migrate-synonyms-to-db.ts
 *
 * This script reads the SYNONYM_MAP from ingredient-synonyms.ts and
 * migrates all ingredients and their synonyms to the database.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Import the synonym map directly since it's a TypeScript file
// We'll parse it from the file instead to avoid circular dependencies

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYNONYMS_FILE = path.join(__dirname, '../src/lib/ingredient-synonyms.ts');

interface MigrationStats {
  newIngredients: number;
  existingIngredients: number;
  newSynonyms: number;
  existingSynonyms: number;
  errors: string[];
}

/**
 * Parse the SYNONYM_MAP from the TypeScript file
 * This is a simplified parser that extracts the key-value pairs
 */
function parseSynonymMap(): Record<string, string[]> {
  const content = fs.readFileSync(SYNONYMS_FILE, 'utf-8');

  // Extract the SYNONYM_MAP object
  const mapMatch = content.match(/const SYNONYM_MAP[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (!mapMatch) {
    throw new Error('Could not find SYNONYM_MAP in file');
  }

  const mapContent = mapMatch[1];
  const result: Record<string, string[]> = {};

  // Match each ingredient entry: 'name': ['synonym1', 'synonym2'],
  // Also handles: name: ['synonym1'],  (without quotes on key)
  const entryRegex = /^\s*['"]?([^'":\n]+?)['"]?\s*:\s*\[(.*?)\],?\s*$/gm;

  let match;
  while ((match = entryRegex.exec(mapContent)) !== null) {
    const name = match[1].trim();
    const synonymsStr = match[2];

    // Skip comment lines
    if (name.startsWith('//')) continue;

    // Parse synonyms array
    const synonyms: string[] = [];
    const synonymRegex = /'([^']+)'/g;
    let synMatch;
    while ((synMatch = synonymRegex.exec(synonymsStr)) !== null) {
      synonyms.push(synMatch[1]);
    }

    if (name && !name.includes('//')) {
      result[name.toLowerCase()] = synonyms;
    }
  }

  return result;
}

async function migrateToDatabase(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    newIngredients: 0,
    existingIngredients: 0,
    newSynonyms: 0,
    existingSynonyms: 0,
    errors: [],
  };

  console.log('Parsing SYNONYM_MAP from file...');
  const synonymMap = parseSynonymMap();
  const ingredientCount = Object.keys(synonymMap).length;
  console.log(`Found ${ingredientCount} ingredients in SYNONYM_MAP\n`);

  console.log('Starting database migration...\n');

  for (const [canonicalName, synonyms] of Object.entries(synonymMap)) {
    try {
      // First, ensure the ingredient exists
      let ingredient = await prisma.ingredient.findUnique({
        where: { name: canonicalName },
      });

      if (!ingredient) {
        ingredient = await prisma.ingredient.create({
          data: { name: canonicalName },
        });
        stats.newIngredients++;
      } else {
        stats.existingIngredients++;
      }

      // Add all synonyms
      for (const synonym of synonyms) {
        const normalizedSynonym = synonym.toLowerCase().trim();
        if (!normalizedSynonym) continue;

        try {
          await prisma.ingredientSynonym.create({
            data: {
              ingredientId: ingredient.id,
              synonym: normalizedSynonym,
              source: 'manual',
            },
          });
          stats.newSynonyms++;
        } catch (e: unknown) {
          // Unique constraint violation means it already exists
          if ((e as { code?: string }).code === 'P2002') {
            stats.existingSynonyms++;
          } else {
            throw e;
          }
        }
      }
    } catch (error) {
      const errMsg = `Error processing ${canonicalName}: ${error}`;
      stats.errors.push(errMsg);
      console.error(errMsg);
    }
  }

  return stats;
}

async function main() {
  console.log('=== Synonym Map Database Migration ===\n');

  const startTime = Date.now();

  try {
    const stats = await migrateToDatabase();

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('\n=== Migration Complete ===\n');
    console.log(`New ingredients created: ${stats.newIngredients}`);
    console.log(`Existing ingredients found: ${stats.existingIngredients}`);
    console.log(`New synonyms created: ${stats.newSynonyms}`);
    console.log(`Existing synonyms skipped: ${stats.existingSynonyms}`);
    console.log(`Duration: ${duration}s`);

    if (stats.errors.length > 0) {
      console.log(`\nErrors: ${stats.errors.length}`);
      stats.errors.forEach((e) => console.error(`  - ${e}`));
    }

    // Log the job
    await prisma.ingredientFetchJob.create({
      data: {
        source: 'manual',
        status: stats.errors.length > 0 ? 'completed_with_errors' : 'completed',
        newIngredients: stats.newIngredients,
        newSynonyms: stats.newSynonyms,
        skipped: stats.existingIngredients + stats.existingSynonyms,
        errorMessage: stats.errors.length > 0 ? stats.errors.join('\n') : null,
        duration,
      },
    });

    console.log('\nJob logged to IngredientFetchJob table.');
  } catch (error) {
    console.error('Migration failed:', error);

    await prisma.ingredientFetchJob.create({
      data: {
        source: 'manual',
        status: 'failed',
        errorMessage: String(error),
        duration: Math.round((Date.now() - startTime) / 1000),
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

main();
