/**
 * Accuracy Measurement Script
 *
 * Week 5: ML Models & Improvement
 *
 * Measures ingredient extraction accuracy by comparing
 * current extraction results against labeled ground truth.
 *
 * Usage:
 *   npx ts-node scripts/measure-accuracy.ts
 *   npx ts-node scripts/measure-accuracy.ts --limit 50
 */

import { PrismaClient } from '@prisma/client';
import { extractIngredientsFromVideo } from '../lib/ingredient-extractor.js';
import { normalizeIngredient } from '../lib/ingredient-synonyms.js';

const prisma = new PrismaClient();

interface AccuracyMetrics {
  precision: number;
  recall: number;
  f1: number;
  exactMatch: number;
}

interface VideoResult {
  videoId: string;
  title: string;
  groundTruth: string[];
  extracted: string[];
  truePositives: string[];
  falsePositives: string[];
  falseNegatives: string[];
  precision: number;
  recall: number;
  f1: number;
}

async function measureAccuracy(limit?: number): Promise<void> {
  console.log('='.repeat(60));
  console.log('Ingredient Extraction Accuracy Measurement');
  console.log('='.repeat(60));
  console.log('');

  // Get labeled videos
  const labeledVideos = await prisma.video.findMany({
    where: {
      labeledAt: { not: null },
    },
    include: {
      videoIngredients: {
        include: { ingredient: true },
      },
    },
    take: limit,
    orderBy: { labeledAt: 'desc' },
  });

  if (labeledVideos.length === 0) {
    console.log('No labeled videos found. Label some videos first using /admin/label');
    return;
  }

  console.log(`Found ${labeledVideos.length} labeled videos for evaluation\n`);

  const results: VideoResult[] = [];
  let totalTP = 0;
  let totalFP = 0;
  let totalFN = 0;
  let exactMatches = 0;

  for (const video of labeledVideos) {
    // Ground truth: ingredients from labeled video
    const groundTruth = video.videoIngredients.map((vi) =>
      normalizeIngredient(vi.ingredient.name)
    );

    // Re-extract using current extractor
    const extracted = await extractIngredientsFromVideo(
      video.title,
      video.description
    );
    const extractedNames = extracted.map((e) => normalizeIngredient(e.name));

    // Calculate true positives, false positives, false negatives
    const groundTruthSet = new Set(groundTruth);
    const extractedSet = new Set(extractedNames);

    const truePositives = extractedNames.filter((e) => groundTruthSet.has(e));
    const falsePositives = extractedNames.filter((e) => !groundTruthSet.has(e));
    const falseNegatives = groundTruth.filter((g) => !extractedSet.has(g));

    const tp = truePositives.length;
    const fp = falsePositives.length;
    const fn = falseNegatives.length;

    totalTP += tp;
    totalFP += fp;
    totalFN += fn;

    // Precision = TP / (TP + FP)
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    // Recall = TP / (TP + FN)
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    // F1 = 2 * (precision * recall) / (precision + recall)
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    // Exact match: all ground truth extracted, no false positives
    if (fp === 0 && fn === 0) {
      exactMatches++;
    }

    results.push({
      videoId: video.id,
      title: video.title.slice(0, 50) + (video.title.length > 50 ? '...' : ''),
      groundTruth,
      extracted: extractedNames,
      truePositives,
      falsePositives,
      falseNegatives,
      precision,
      recall,
      f1,
    });
  }

  // Calculate overall metrics
  const overallPrecision = totalTP + totalFP > 0 ? totalTP / (totalTP + totalFP) : 0;
  const overallRecall = totalTP + totalFN > 0 ? totalTP / (totalTP + totalFN) : 0;
  const overallF1 =
    overallPrecision + overallRecall > 0
      ? (2 * overallPrecision * overallRecall) / (overallPrecision + overallRecall)
      : 0;
  const exactMatchRate = labeledVideos.length > 0 ? exactMatches / labeledVideos.length : 0;

  // Print overall results
  console.log('='.repeat(60));
  console.log('OVERALL RESULTS');
  console.log('='.repeat(60));
  console.log(`Videos evaluated:    ${labeledVideos.length}`);
  console.log(`Total TP:            ${totalTP}`);
  console.log(`Total FP:            ${totalFP}`);
  console.log(`Total FN:            ${totalFN}`);
  console.log('');
  console.log(`Precision:           ${(overallPrecision * 100).toFixed(1)}%`);
  console.log(`Recall:              ${(overallRecall * 100).toFixed(1)}%`);
  console.log(`F1 Score:            ${(overallF1 * 100).toFixed(1)}%`);
  console.log(`Exact Match Rate:    ${(exactMatchRate * 100).toFixed(1)}%`);
  console.log('');

  // Check against Week 5 target (>70% accuracy)
  const targetMet = overallF1 >= 0.7;
  console.log(
    `Week 5 Target (F1 ≥ 70%): ${targetMet ? '✅ MET' : '❌ NOT MET'}`
  );
  console.log('');

  // Print per-video breakdown for low scorers
  const lowScorers = results.filter((r) => r.f1 < 0.7).slice(0, 10);
  if (lowScorers.length > 0) {
    console.log('='.repeat(60));
    console.log('LOW-SCORING VIDEOS (F1 < 70%)');
    console.log('='.repeat(60));
    for (const r of lowScorers) {
      console.log(`\n${r.title}`);
      console.log(`  Ground truth: ${r.groundTruth.join(', ') || '(none)'}`);
      console.log(`  Extracted:    ${r.extracted.join(', ') || '(none)'}`);
      console.log(`  False pos:    ${r.falsePositives.join(', ') || '(none)'}`);
      console.log(`  False neg:    ${r.falseNegatives.join(', ') || '(none)'}`);
      console.log(`  F1: ${(r.f1 * 100).toFixed(1)}%`);
    }
  }

  // Print summary stats
  console.log('');
  console.log('='.repeat(60));
  console.log('DISTRIBUTION');
  console.log('='.repeat(60));
  const excellent = results.filter((r) => r.f1 >= 0.9).length;
  const good = results.filter((r) => r.f1 >= 0.7 && r.f1 < 0.9).length;
  const fair = results.filter((r) => r.f1 >= 0.5 && r.f1 < 0.7).length;
  const poor = results.filter((r) => r.f1 < 0.5).length;
  console.log(`Excellent (≥90%):    ${excellent} (${((excellent / labeledVideos.length) * 100).toFixed(1)}%)`);
  console.log(`Good (70-89%):       ${good} (${((good / labeledVideos.length) * 100).toFixed(1)}%)`);
  console.log(`Fair (50-69%):       ${fair} (${((fair / labeledVideos.length) * 100).toFixed(1)}%)`);
  console.log(`Poor (<50%):         ${poor} (${((poor / labeledVideos.length) * 100).toFixed(1)}%)`);

  await prisma.$disconnect();
}

// Parse CLI args
const args = process.argv.slice(2);
let limit: number | undefined;
const limitIdx = args.indexOf('--limit');
if (limitIdx !== -1 && args[limitIdx + 1]) {
  limit = parseInt(args[limitIdx + 1], 10);
}

measureAccuracy(limit).catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
