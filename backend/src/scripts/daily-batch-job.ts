/**
 * Daily Batch Job for Pre-Crawling YouTube Videos
 * 
 * This script runs daily to:
 * 1. Generate intelligent queries based on trends and gaps
 * 2. Fetch videos from YouTube
 * 3. Extract ingredients immediately
 * 4. Store everything in database
 * 
 * This implements the pre-crawl strategy:
 * - Pre-crawl YouTube videos in batch (daily job)
 * - Extract ingredients from all videos upfront
 * - Store everything in database
 * - When user searches → query pre-extracted data
 * 
 * Usage:
 *   npm run batch:daily
 * 
 * For cron/scheduled tasks:
 *   # Run daily at 2 AM
 *   0 2 * * * cd /path/to/kitvas/backend && npm run batch:daily
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { searchYouTubeVideos, getVideoDetails } from '../lib/youtube.js';
import {
  generateIntelligentQueries,
  findGapOpportunities,
} from '../lib/query-generator.js';
import { processVideoIngredients } from '../lib/ingredient-extractor.js';

// Load environment variables
config();

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is required');
  process.exit(1);
}

if (!process.env.YOUTUBE_API_KEY) {
  console.error('❌ Error: YOUTUBE_API_KEY environment variable is required');
  process.exit(1);
}

const prisma = new PrismaClient();

interface BatchJobStats {
  startTime: Date;
  queriesGenerated: number;
  videosFetched: number;
  videosIngested: number;
  videosSkipped: number;
  ingredientsExtracted: number;
  errors: number;
}

/**
 * Main batch job execution
 */
async function runDailyBatchJob() {
  const stats: BatchJobStats = {
    startTime: new Date(),
    queriesGenerated: 0,
    videosFetched: 0,
    videosIngested: 0,
    videosSkipped: 0,
    ingredientsExtracted: 0,
    errors: 0,
  };

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 Daily Batch Job: Pre-Crawling YouTube Videos');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Started at: ${stats.startTime.toISOString()}\n`);

  try {
    // Step 1: Generate intelligent queries
    console.log('📋 Step 1: Generating intelligent queries...');
    const queries = await generateIntelligentQueries(prisma, {
      maxQueries: 30,
      useAutocomplete: true,
      useSearchPatterns: true,
      usePopularCombinations: true,
    });

    if (queries.length === 0) {
      console.log('⚠️  No queries generated, using fallback queries');
      queries.push(
        'miso pasta',
        'gochujang chicken',
        'air fryer tofu',
        'tahini pasta',
        'harissa chicken'
      );
    }

    stats.queriesGenerated = queries.length;
    console.log(`✅ Generated ${queries.length} queries\n`);

    // Step 2: Fetch and ingest videos with ingredient extraction
    console.log('📺 Step 2: Fetching videos and extracting ingredients...');
    const maxResultsPerQuery = 20;
    const apiKey = process.env.YOUTUBE_API_KEY!;

    for (const query of queries) {
      console.log(`\n🔍 Query: "${query}"`);
      
      try {
        // Search for videos
        const searchResults = await searchYouTubeVideos(query, apiKey, maxResultsPerQuery);
        stats.videosFetched += searchResults.length;
        console.log(`   Found ${searchResults.length} videos`);

        if (searchResults.length === 0) {
          continue;
        }

        // Get video IDs
        const videoIds = searchResults.map(v => v.id.videoId).filter(Boolean);
        if (videoIds.length === 0) {
          continue;
        }

        // Fetch detailed information
        const videoDetails = await getVideoDetails(videoIds, apiKey);
        console.log(`   Fetched details for ${videoDetails.length} videos`);

        // Process each video
        for (const video of videoDetails) {
          try {
            const youtubeId = video.id;

            // Check if video already exists
            const existing = await prisma.video.findUnique({
              where: { youtubeId },
            });

            if (existing) {
              stats.videosSkipped++;
              continue;
            }

            // Store video
            const snippet = video.snippet;
            const statistics = video.statistics;

            const storedVideo = await prisma.video.create({
              data: {
                youtubeId,
                title: snippet.title,
                description: snippet.description || null,
                thumbnailUrl: snippet.thumbnails.high?.url || 
                             snippet.thumbnails.medium?.url || 
                             snippet.thumbnails.default?.url,
                publishedAt: new Date(snippet.publishedAt),
                views: statistics?.viewCount ? parseInt(statistics.viewCount, 10) : null,
                viewsUpdatedAt: new Date(),
                channelId: snippet.channelId || null,
                extractedAt: new Date(),
              },
            });

            // Extract ingredients immediately (pre-crawl strategy)
            const ingredientCount = await processVideoIngredients(
              prisma,
              storedVideo.id,
              snippet.title,
              snippet.description || null
            );

            stats.videosIngested++;
            stats.ingredientsExtracted += ingredientCount;

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));

          } catch (error: any) {
            stats.errors++;
            if (stats.errors <= 3) {
              console.error(`   ❌ Error processing video: ${error.message}`);
            }
          }
        }

        // Wait between queries
        if (queries.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error: any) {
        stats.errors++;
        console.error(`   ❌ Error processing query "${query}": ${error.message}`);
      }
    }

    // Step 3: Summary and reporting
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✨ Batch Job Complete');
    console.log('═══════════════════════════════════════════════════════════');
    
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - stats.startTime.getTime()) / 1000);

    console.log(`Duration: ${duration}s`);
    console.log(`Queries generated: ${stats.queriesGenerated}`);
    console.log(`Videos fetched: ${stats.videosFetched}`);
    console.log(`Videos ingested: ${stats.videosIngested}`);
    console.log(`Videos skipped (already exist): ${stats.videosSkipped}`);
    console.log(`Ingredients extracted: ${stats.ingredientsExtracted}`);
    console.log(`Errors: ${stats.errors}`);

    // Database summary
    const totalVideos = await prisma.video.count();
    const videosWithIngredients = await prisma.video.count({
      where: {
        videoIngredients: {
          some: {},
        },
      },
    });
    const totalIngredients = await prisma.ingredient.count();

    console.log('\n📊 Database Summary:');
    console.log(`   Total videos: ${totalVideos}`);
    console.log(`   Videos with ingredients: ${videosWithIngredients}`);
    console.log(`   Total unique ingredients: ${totalIngredients}`);
    console.log(`   Coverage: ${totalVideos > 0 ? Math.round((videosWithIngredients / totalVideos) * 100) : 0}% of videos have ingredients`);

    console.log('\n✅ Daily batch job completed successfully!');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Fatal error in batch job:', error);
    process.exit(1);
  }
}

/**
 * Test database connection
 */
async function testConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful\n');
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed!');
    console.error(`   Error: ${error.message}\n`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      process.exit(1);
    }

    // Run batch job
    await runDailyBatchJob();

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
