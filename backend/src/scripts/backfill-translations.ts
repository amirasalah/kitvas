/**
 * Backfill Transcript Translations
 *
 * Two-pass approach:
 *   Pass 1 (detect): Marks language for all videos using character heuristics. Instant, no LLM.
 *   Pass 2 (translate): Translates non-English videos and re-extracts ingredients. Uses Groq LLM.
 *
 * Usage:
 *   npx tsx src/scripts/backfill-translations.ts detect          # Pass 1: mark languages
 *   npx tsx src/scripts/backfill-translations.ts translate        # Pass 2: translate + re-extract
 *   npx tsx src/scripts/backfill-translations.ts translate --limit 10  # Translate 10 at a time
 *   npx tsx src/scripts/backfill-translations.ts status           # Show current state
 */

import { PrismaClient } from '@prisma/client';
import { translateToEnglish } from '../lib/translator.js';
import { extractIngredientsFromVideo, storeExtractedIngredients } from '../lib/ingredient-extractor.js';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const command = args[0] || 'status';
const limitFlag = args.indexOf('--limit');
const LIMIT = limitFlag >= 0 ? parseInt(args[limitFlag + 1], 10) : undefined;
const BATCH_SIZE = 50;

// Unicode script ranges for non-Latin detection
const NON_LATIN_RANGES = [
  /[\u0900-\u097F]/,  // Devanagari (Hindi, Marathi, Sanskrit)
  /[\u0980-\u09FF]/,  // Bengali
  /[\u0A00-\u0A7F]/,  // Gurmukhi (Punjabi)
  /[\u0A80-\u0AFF]/,  // Gujarati
  /[\u0B00-\u0B7F]/,  // Oriya
  /[\u0B80-\u0BFF]/,  // Tamil
  /[\u0C00-\u0C7F]/,  // Telugu
  /[\u0C80-\u0CFF]/,  // Kannada
  /[\u0D00-\u0D7F]/,  // Malayalam
  /[\u0600-\u06FF]/,  // Arabic/Urdu
  /[\u0750-\u077F]/,  // Arabic Supplement
  /[\uFB50-\uFDFF]/,  // Arabic Presentation Forms-A
  /[\uFE70-\uFEFF]/,  // Arabic Presentation Forms-B
  /[\u4E00-\u9FFF]/,  // CJK Unified (Chinese)
  /[\u3040-\u309F]/,  // Hiragana (Japanese)
  /[\u30A0-\u30FF]/,  // Katakana (Japanese)
  /[\uAC00-\uD7AF]/,  // Hangul (Korean)
  /[\u0E00-\u0E7F]/,  // Thai
  /[\u1000-\u109F]/,  // Myanmar
];

const SCRIPT_NAMES = [
  'devanagari', 'bengali', 'gurmukhi', 'gujarati', 'oriya',
  'tamil', 'telugu', 'kannada', 'malayalam',
  'arabic', 'arabic_sup', 'arabic_pf_a', 'arabic_pf_b',
  'cjk', 'hiragana', 'katakana', 'hangul', 'thai', 'myanmar',
];

const SCRIPT_TO_LANG: Record<string, string> = {
  'devanagari': 'hi', 'bengali': 'bn', 'gurmukhi': 'pa',
  'gujarati': 'gu', 'oriya': 'or', 'tamil': 'ta',
  'telugu': 'te', 'kannada': 'kn', 'malayalam': 'ml',
  'arabic': 'ar', 'arabic_sup': 'ar', 'arabic_pf_a': 'ar', 'arabic_pf_b': 'ar',
  'cjk': 'zh', 'hiragana': 'ja', 'katakana': 'ja',
  'hangul': 'ko', 'thai': 'th', 'myanmar': 'my',
};

function detectLanguageHeuristic(text: string): string {
  const sample = text.substring(0, 1000);

  const scriptCounts: Record<string, number> = {};
  for (let i = 0; i < NON_LATIN_RANGES.length; i++) {
    const regex = new RegExp(NON_LATIN_RANGES[i].source, 'g');
    const matches = sample.match(regex);
    if (matches) {
      const lang = SCRIPT_TO_LANG[SCRIPT_NAMES[i]];
      scriptCounts[lang] = (scriptCounts[lang] || 0) + matches.length;
    }
  }

  let maxLang = '';
  let maxCount = 0;
  for (const [lang, count] of Object.entries(scriptCounts)) {
    if (count > maxCount) { maxLang = lang; maxCount = count; }
  }

  const totalChars = sample.replace(/\s/g, '').length || 1;
  if (maxCount / totalChars > 0.1) return maxLang;

  // Fallback: overall non-ASCII ratio
  const nonAscii = sample.replace(/[\x00-\x7F]/g, '').length;
  if (nonAscii / sample.length > 0.3) return 'unknown';

  return 'en';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =========================================================================
// PASS 1: Detect languages (no LLM, instant)
// =========================================================================
async function detectPass() {
  console.log('=== Pass 1: Language Detection ===');

  const total = await prisma.video.count({
    where: { transcript: { not: null }, transcriptLanguage: null },
  });
  console.log(`Videos needing detection: ${total}`);

  let processed = 0;
  let english = 0;
  let nonEnglish = 0;
  let short = 0;
  const langCounts: Record<string, number> = {};
  let cursor: string | undefined;

  while (true) {
    const videos = await prisma.video.findMany({
      where: { transcript: { not: null }, transcriptLanguage: null },
      select: { id: true, transcript: true },
      take: BATCH_SIZE,
      orderBy: { id: 'asc' },
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    if (videos.length === 0) break;
    cursor = videos[videos.length - 1].id;

    for (const video of videos) {
      const transcript = video.transcript!;
      let lang: string;

      if (transcript.length < 50) {
        lang = 'en';
        short++;
      } else {
        lang = detectLanguageHeuristic(transcript);
      }

      await prisma.video.update({
        where: { id: video.id },
        data: { transcriptLanguage: lang },
      });

      if (lang === 'en') { english++; } else { nonEnglish++; }
      langCounts[lang] = (langCounts[lang] || 0) + 1;
      processed++;
    }

    if (processed % 200 === 0) {
      console.log(`  Progress: ${processed}/${total}`);
    }
  }

  console.log(`\nDone! Processed: ${processed}`);
  console.log(`  English: ${english} (${short} too short)`);
  console.log(`  Non-English: ${nonEnglish}`);
  console.log('  By language:', langCounts);
}

// =========================================================================
// PASS 2: Translate non-English + re-extract ingredients
// =========================================================================
async function translatePass() {
  console.log('=== Pass 2: Translation + Re-extraction ===');
  if (LIMIT) console.log(`Limit: ${LIMIT} videos`);

  const total = await prisma.video.count({
    where: {
      transcriptLanguage: { not: null, notIn: ['en', 'unknown'] },
      transcriptEnglish: null,
      transcript: { not: null },
    },
  });
  console.log(`Videos needing translation: ${total}`);
  if (total === 0) { console.log('Nothing to do!'); return; }

  let processed = 0;
  let translated = 0;
  let reExtracted = 0;
  let errors = 0;

  const videos = await prisma.video.findMany({
    where: {
      transcriptLanguage: { not: null, notIn: ['en', 'unknown'] },
      transcriptEnglish: null,
      transcript: { not: null },
    },
    select: {
      id: true,
      youtubeId: true,
      title: true,
      description: true,
      transcript: true,
      transcriptLanguage: true,
    },
    take: LIMIT || 1000,
    orderBy: { id: 'asc' },
  });

  for (const video of videos) {
    processed++;
    console.log(`  [${processed}/${videos.length}] ${video.youtubeId} (${video.transcriptLanguage}) | "${video.title.slice(0, 50)}"`);

    try {
      // Translate with retry on rate limit
      let translatedText: string | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          translatedText = await translateToEnglish(video.transcript!);
          break;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('429') || msg.includes('rate_limit')) {
            // Extract wait time from error if available
            const waitMatch = msg.match(/try again in (\d+)m/);
            const waitMinutes = waitMatch ? parseInt(waitMatch[1], 10) + 1 : 60 * (attempt + 1);
            console.log(`    Rate limited. Waiting ${waitMinutes}m...`);
            await sleep(waitMinutes * 60 * 1000);
          } else {
            throw err;
          }
        }
      }

      if (!translatedText) {
        console.log('    Failed after 3 retries, skipping');
        errors++;
        continue;
      }

      // Save translation
      await prisma.video.update({
        where: { id: video.id },
        data: { transcriptEnglish: translatedText },
      });
      translated++;

      // Re-extract ingredients using translated transcript
      const extractedIngredients = await extractIngredientsFromVideo(
        video.title,
        video.description,
        translatedText
      );

      if (extractedIngredients.length > 0) {
        await prisma.videoIngredient.deleteMany({ where: { videoId: video.id } });
        await storeExtractedIngredients(prisma, video.id, extractedIngredients);
        reExtracted++;
        console.log(`    → ${extractedIngredients.length} ingredients extracted`);
      }
    } catch (err) {
      errors++;
      console.error(`    Error:`, err instanceof Error ? err.message : err);
    }

    // Throttle: wait 15s between videos to stay within Groq TPM limit (12K/min)
    if (processed < videos.length) {
      await sleep(15000);
    }
  }

  console.log(`\nDone! Translated: ${translated}/${processed}, Re-extracted: ${reExtracted}, Errors: ${errors}`);
}

// =========================================================================
// STATUS: Show current state
// =========================================================================
async function showStatus() {
  const total = await prisma.video.count({ where: { transcript: { not: null } } });
  const noLang = await prisma.video.count({ where: { transcript: { not: null }, transcriptLanguage: null } });
  const english = await prisma.video.count({ where: { transcriptLanguage: 'en' } });
  const nonEnNeedsTranslation = await prisma.video.count({
    where: { transcriptLanguage: { not: null, notIn: ['en', 'unknown'] }, transcriptEnglish: null },
  });
  const translated = await prisma.video.count({ where: { transcriptEnglish: { not: null } } });

  console.log('=== Transcript Translation Status ===');
  console.log(`Total with transcript: ${total}`);
  console.log(`  Language detected: ${total - noLang}`);
  console.log(`  Needs detection:   ${noLang}`);
  console.log(`  English:           ${english}`);
  console.log(`  Non-English:       ${total - noLang - english}`);
  console.log(`  Translated:        ${translated}`);
  console.log(`  Needs translation: ${nonEnNeedsTranslation}`);

  if (noLang > 0) console.log(`\nRun: npx tsx src/scripts/backfill-translations.ts detect`);
  if (nonEnNeedsTranslation > 0) console.log(`Run: npx tsx src/scripts/backfill-translations.ts translate --limit 10`);
}

// =========================================================================
// MAIN
// =========================================================================
async function main() {
  switch (command) {
    case 'detect':
      await detectPass();
      break;
    case 'translate':
      await translatePass();
      break;
    case 'status':
      await showStatus();
      break;
    default:
      console.log('Usage: npx tsx src/scripts/backfill-translations.ts [detect|translate|status]');
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
