/**
 * Background Extraction Queue
 * Queues YouTube videos for ingredient extraction in the background
 * This allows fresh YouTube results to be enriched over time
 */

import type { PrismaClient } from '@prisma/client';
import type { YouTubeVideo } from './youtube.js';
import { processVideoIngredients } from './ingredient-extractor.js';
import { getVideoDetails } from './youtube.js';

interface QueuedVideo {
  youtubeId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  publishedAt: string;
  views: number | null;
  queuedAt: number;
}

const queue: QueuedVideo[] = [];
const processedIds = new Set<string>(); // Track recently processed to avoid duplicates
let isProcessing = false;
let workerInterval: NodeJS.Timeout | null = null;

const PROCESS_INTERVAL = 5000; // Process every 5 seconds
const MAX_QUEUE_SIZE = 100; // Limit queue size
const PROCESSED_TTL = 60 * 60 * 1000; // Remember processed IDs for 1 hour

/**
 * Add YouTube videos to the extraction queue
 * Skips videos already in the database or recently processed
 */
export async function queueForExtraction(
  videos: YouTubeVideo[],
  prisma: PrismaClient
): Promise<number> {
  let queued = 0;

  for (const video of videos) {
    const youtubeId = video.id;

    // Skip if already processed recently
    if (processedIds.has(youtubeId)) {
      continue;
    }

    // Skip if already in queue
    if (queue.some(q => q.youtubeId === youtubeId)) {
      continue;
    }

    // Skip if already in database
    const existing = await prisma.video.findUnique({
      where: { youtubeId },
      select: { id: true },
    });

    if (existing) {
      processedIds.add(youtubeId);
      continue;
    }

    // Add to queue (limit size)
    if (queue.length < MAX_QUEUE_SIZE) {
      queue.push({
        youtubeId,
        title: video.snippet.title,
        description: video.snippet.description || null,
        thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default.url,
        publishedAt: video.snippet.publishedAt,
        views: video.statistics?.viewCount ? parseInt(video.statistics.viewCount, 10) : null,
        queuedAt: Date.now(),
      });
      queued++;
    }
  }

  return queued;
}

/**
 * Process the next video in the queue
 * Creates video record and extracts ingredients
 */
async function processNextVideo(prisma: PrismaClient): Promise<boolean> {
  const video = queue.shift();
  if (!video) {
    return false;
  }

  try {
    // Create video record
    const dbVideo = await prisma.video.create({
      data: {
        youtubeId: video.youtubeId,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        publishedAt: new Date(video.publishedAt),
        views: video.views,
        extractedAt: new Date(),
      },
    });

    // Extract and store ingredients
    const ingredientCount = await processVideoIngredients(
      prisma,
      dbVideo.id,
      video.title,
      video.description
    );

    console.log(`[Queue] Processed ${video.youtubeId}: "${video.title.slice(0, 50)}..." - ${ingredientCount} ingredients`);
    processedIds.add(video.youtubeId);
    return true;
  } catch (error) {
    // If video already exists (race condition), just mark as processed
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      processedIds.add(video.youtubeId);
      return true;
    }

    console.error(`[Queue] Failed to process ${video.youtubeId}:`, error);
    return false;
  }
}

/**
 * Start the background worker
 * Processes queued videos periodically
 */
export function startExtractionWorker(prisma: PrismaClient): void {
  if (workerInterval) {
    return; // Already running
  }

  console.log('[Queue] Starting extraction worker...');

  workerInterval = setInterval(async () => {
    if (isProcessing || queue.length === 0) {
      return;
    }

    isProcessing = true;
    try {
      await processNextVideo(prisma);
    } finally {
      isProcessing = false;
    }
  }, PROCESS_INTERVAL);
}

/**
 * Stop the background worker
 */
export function stopExtractionWorker(): void {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('[Queue] Extraction worker stopped');
  }
}

/**
 * Get queue stats for monitoring
 */
export function getQueueStats(): {
  queueSize: number;
  processedCount: number;
  isProcessing: boolean;
} {
  return {
    queueSize: queue.length,
    processedCount: processedIds.size,
    isProcessing,
  };
}

/**
 * Clean up old processed IDs to prevent memory leak
 */
export function cleanupProcessedIds(): void {
  // In a real implementation, you'd track timestamps per ID
  // For now, just clear if too large
  if (processedIds.size > 1000) {
    processedIds.clear();
  }
}
