/**
 * Backfill Transcripts Script
 *
 * Re-extracts ingredients for existing videos using transcripts.
 * Targets videos that were imported without transcript data
 * (i.e., no VideoIngredient with source='transcript').
 *
 * Prioritizes high-view videos first for maximum impact.
 *
 * Usage:
 *   npx tsx backend/src/scripts/backfill-transcripts.ts
 *   npx tsx backend/src/scripts/backfill-transcripts.ts --limit 100
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { fetchTranscript } from '../lib/transcript-fetcher.js';
import { extractIngredientsFromVideo, storeExtractedIngredients } from '../lib/ingredient-extractor.js';

config();

const prisma = new PrismaClient();

async function backfillTranscripts(limit: number = 500) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Transcript Backfill - Re-extract with transcript priority');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Find videos without a stored transcript, ordered by views
  const videos = await prisma.video.findMany({
    where: {
      transcript: null,
    },
    select: {
      id: true,
      youtubeId: true,
      title: true,
      description: true,
    },
    orderBy: {
      views: 'desc',
    },
    take: limit,
  });

  console.log(`Found ${videos.length} videos without transcript data\n`);

  if (videos.length === 0) {
    console.log('Nothing to backfill!');
    return;
  }

  const stats = {
    processed: 0,
    transcriptsFound: 0,
    ingredientsUpdated: 0,
    errors: 0,
  };

  for (const video of videos) {
    try {
      // Fetch transcript
      const transcript = await fetchTranscript(video.youtubeId);

      if (!transcript) {
        stats.processed++;
        continue;
      }

      stats.transcriptsFound++;

      // Persist transcript to database
      await prisma.video.update({
        where: { id: video.id },
        data: { transcript },
      });

      // Re-extract ingredients with transcript priority
      const extracted = await extractIngredientsFromVideo(
        video.title,
        video.description,
        transcript
      );

      if (extracted.length === 0) {
        stats.processed++;
        continue;
      }

      // Delete old ingredient links and replace with new extraction
      await prisma.videoIngredient.deleteMany({
        where: { videoId: video.id },
      });

      await storeExtractedIngredients(prisma, video.id, extracted);

      stats.ingredientsUpdated++;
      stats.processed++;

      console.log(`  ✅ ${video.youtubeId} - ${extracted.length} ingredients (transcript): "${video.title.substring(0, 50)}..."`);

      // Rate limiting (2s between transcript fetches)
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      stats.errors++;
      stats.processed++;
      if (stats.errors <= 5) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`  ❌ ${video.youtubeId}: ${msg}`);
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Backfill Complete');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Processed:    ${stats.processed}`);
  console.log(`  Transcripts:  ${stats.transcriptsFound}`);
  console.log(`  Updated:      ${stats.ingredientsUpdated}`);
  console.log(`  Errors:       ${stats.errors}`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Parse CLI args
const limitArg = process.argv.find(a => a.startsWith('--limit'));
const limit = limitArg ? parseInt(limitArg.split('=')[1] || process.argv[process.argv.indexOf(limitArg) + 1] || '500', 10) : 500;

backfillTranscripts(limit)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
