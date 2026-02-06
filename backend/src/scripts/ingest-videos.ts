/**
 * Video Ingestion Script
 * 
 * This script fetches videos from YouTube API and stores them in the database.
 * It uses intelligent ingredient-based query generation aligned with Kitvas's
 * ingredient-level intelligence strategy.
 * 
 * Usage:
 *   # Use intelligent query generation (default)
 *   npm run ingest:videos
 *   
 *   # Use intelligent generation with options
 *   npm run ingest:videos -- --intelligent --max 30
 *   
 *   # Manual queries (backward compatible)
 *   npm run ingest:videos -- --query "miso pasta" --max 50
 *   npm run ingest:videos -- --queries "miso pasta,gochujang chicken"
 *   
 *   # Find gap opportunities (high demand, low supply)
 *   npm run ingest:videos -- --gaps
 * 
 * Intelligent Query Generation Strategies:
 *   - Popular ingredient combinations (curated list)
 *   - Search patterns from database (user behavior)
 *   - Ingredient co-occurrence (what appears together in videos)
 *   - YouTube autocomplete (demand signals)
 *   - Gap opportunities (high search, low video coverage)
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { searchYouTubeVideos, getVideoDetails } from '../lib/youtube.js';
import {
  generateIntelligentQueries,
  findGapOpportunities,
  QueryGenerationOptions,
} from '../lib/query-generator.js';
import { processVideoIngredients } from '../lib/ingredient-extractor.js';
import { fetchTranscript } from '../lib/transcript-fetcher.js';

// Load environment variables from .env file
config();

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is required');
  console.error('   Create a .env file in the backend directory with:');
  console.error('   DATABASE_URL="postgresql://user:password@localhost:5432/kitvas"');
  process.exit(1);
}

const prisma = new PrismaClient();

interface IngestionOptions {
  queries: string[];
  maxResultsPerQuery: number;
  apiKey: string;
  useIntelligentGeneration?: boolean;
  findGaps?: boolean;
  queryOptions?: QueryGenerationOptions;
}

async function ingestVideos(options: IngestionOptions) {
  const { queries, maxResultsPerQuery, apiKey } = options;
  
  console.log(`🚀 Starting batch video ingestion for ${queries.length} search queries...`);
  console.log(`   Max results per query: ${maxResultsPerQuery}`);
  console.log(`   Ingredients will be extracted immediately after fetching\n`);
  
  let totalIngested = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let totalIngredientsExtracted = 0;

  for (const query of queries) {
    console.log(`\n📺 Searching for: "${query}"`);
    
    try {
      // Search for videos
      const searchResults = await searchYouTubeVideos(query, apiKey, maxResultsPerQuery);
      console.log(`   Found ${searchResults.length} videos`);

      if (searchResults.length === 0) {
        console.log(`   ⚠️  No videos found for "${query}"`);
        continue;
      }

      // Get video IDs from search results
      const videoIds = searchResults.map(v => v.id.videoId).filter(Boolean);
      
      if (videoIds.length === 0) {
        console.log(`   ⚠️  No valid video IDs found`);
        continue;
      }
      
      // Fetch detailed information (including view counts)
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
            totalSkipped++;
            continue;
          }

          // Extract data
          const snippet = video.snippet;
          const statistics = video.statistics;
          
          // Store video
          const storedVideo = await prisma.video.create({
            data: {
              youtubeId,
              title: snippet.title,
              description: snippet.description || null,
              thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.medium?.url || snippet.thumbnails.default?.url,
              publishedAt: new Date(snippet.publishedAt),
              views: statistics?.viewCount ? parseInt(statistics.viewCount, 10) : null,
              extractedAt: new Date(),
            },
          });

          // Fetch transcript for better ingredient extraction
          let transcript: string | null = null;
          try {
            transcript = await fetchTranscript(youtubeId);
          } catch { /* continue without transcript */ }

          // Extract ingredients (transcript-first when available)
          const ingredientCount = await processVideoIngredients(
            prisma,
            storedVideo.id,
            snippet.title,
            snippet.description || null,
            transcript
          );

          totalIngested++;
          totalIngredientsExtracted += ingredientCount;

          if (ingredientCount > 0) {
            console.log(`   ✅ Stored + extracted ${ingredientCount} ingredients${transcript ? ' (with transcript)' : ''}: "${snippet.title.substring(0, 50)}..."`);
          } else {
            console.log(`   ✅ Stored (no ingredients found): "${snippet.title.substring(0, 50)}..."`);
          }

          // Rate limiting (2s to respect transcript API)
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error: any) {
          totalErrors++;
          // Only show detailed errors for the first few to avoid spam
          if (totalErrors <= 3) {
            console.error(`   ❌ Error processing video: ${error.message}`);
          } else if (totalErrors === 4) {
            console.error(`   ❌ ... (suppressing further error details)`);
          }
        }
      }

      // Wait between queries to avoid rate limits
      if (queries.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error: any) {
      totalErrors++;
      console.error(`   ❌ Error searching for "${query}": ${error.message}`);
    }
  }

  console.log(`\n✨ Batch ingestion complete!`);
  console.log(`   ✅ Ingested: ${totalIngested} videos`);
  console.log(`   🧪 Ingredients extracted: ${totalIngredientsExtracted} total`);
  console.log(`   ⏭️  Skipped (already exist): ${totalSkipped} videos`);
  console.log(`   ❌ Errors: ${totalErrors}`);
  
  // Show summary
  const totalVideos = await prisma.video.count();
  const videosWithIngredients = await prisma.video.count({
    where: {
      videoIngredients: {
        some: {},
      },
    },
  });
  const totalIngredients = await prisma.ingredient.count();
  
  console.log(`\n📊 Database Summary:`);
  console.log(`   Total videos: ${totalVideos}`);
  console.log(`   Videos with ingredients: ${videosWithIngredients}`);
  console.log(`   Total unique ingredients: ${totalIngredients}`);
}

// Parse command line arguments
async function parseArgs(prisma: PrismaClient): Promise<IngestionOptions> {
  const args = process.argv.slice(2);
  
  let queries: string[] = [];
  let maxResultsPerQuery = 20;
  let useIntelligentGeneration = false;
  let findGaps = false;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: YOUTUBE_API_KEY environment variable is required');
    console.error('   Add it to your backend/.env file:');
    console.error('   YOUTUBE_API_KEY="your-api-key"');
    console.error('');
    console.error('   Get an API key from: https://console.cloud.google.com/');
    process.exit(1);
  }

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--query' && args[i + 1]) {
      queries.push(args[i + 1]);
      i++;
    } else if (arg === '--queries' && args[i + 1]) {
      // Comma-separated queries
      queries = args[i + 1].split(',').map(q => q.trim());
      i++;
    } else if (arg === '--max' && args[i + 1]) {
      maxResultsPerQuery = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--intelligent' || arg === '-i') {
      useIntelligentGeneration = true;
    } else if (arg === '--gaps') {
      findGaps = true;
    }
  }

  // If no manual queries provided, use intelligent generation
  if (queries.length === 0) {
    useIntelligentGeneration = true;
  }

  // Generate intelligent queries if requested
  if (useIntelligentGeneration || findGaps) {
    console.log('🧠 Using intelligent query generation...');
    console.log('   This builds Kitvas\'s ingredient-level intelligence moat\n');
    
    if (findGaps) {
      console.log('🔍 Finding gap opportunities (high demand, low supply)...');
      const gapQueries = await findGapOpportunities(prisma, 15);
      if (gapQueries.length > 0) {
        queries.push(...gapQueries);
        console.log(`   Found ${gapQueries.length} gap opportunities\n`);
      } else {
        console.log('   No gap opportunities found, using intelligent generation instead\n');
      }
    }
    
    if (queries.length === 0 || !findGaps) {
      const intelligentQueries = await generateIntelligentQueries(prisma, {
        maxQueries: 30,
        useAutocomplete: true,
        useSearchPatterns: true,
        usePopularCombinations: true,
      });
      queries.push(...intelligentQueries);
    }
    
    if (queries.length === 0) {
      console.warn('⚠️  No queries generated, falling back to popular combinations');
      queries = [
        'miso pasta',
        'gochujang chicken',
        'air fryer tofu',
        'tahini pasta',
        'harissa chicken',
      ];
    }
  }

  return {
    queries,
    maxResultsPerQuery,
    apiKey,
    useIntelligentGeneration,
    findGaps,
  };
}

// Test database connection
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful\n');
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed!');
    console.error(`   Error: ${error.message}\n`);
    
    // Check for common issues
    const dbUrl = process.env.DATABASE_URL || '';
    
    if (error.message.includes('Authentication failed')) {
      console.error('💡 Authentication Error - Common fixes:');
      console.error('   1. Verify your database password is correct');
      console.error('      - Go to Supabase → Settings → Database → Database password');
      console.error('      - Reset it if needed (you\'ll need to update all connection strings)');
      console.error('');
      console.error('   2. Check if password needs URL encoding');
      console.error('      - If password has special characters (!, @, #, etc.), encode them');
      console.error('      - Example: @ becomes %40, # becomes %23');
      console.error('');
      console.error('   3. Verify username format:');
      console.error('      - Should be: postgres.[PROJECT-REF]');
      console.error('      - Your connection string shows:', dbUrl.includes('postgres.') ? '✅ Correct format' : '❌ Wrong format');
      console.error('');
      console.error('   4. Try the other pooler port:');
      console.error('      - Port 5432 with ?pgbouncer=true');
      console.error('      - Port 6543 (current)');
    } else {
      console.error('💡 Troubleshooting:');
      console.error('   1. Check if your Supabase project is active (not paused)');
      console.error('   2. Verify your DATABASE_URL in .env is correct');
      console.error('   3. For Supabase: Go to Project Settings → Database → Connection string');
      console.error('   4. Make sure you\'re using Connection Pooling (not direct connection)');
    }
    console.error('');
    return false;
  }
}

// Main execution
async function main() {
  try {
    // Test database connection first
    const connected = await testConnection();
    if (!connected) {
      process.exit(1);
    }

    const options = await parseArgs(prisma);
    
    if (options.queries.length > 0) {
      console.log(`\n📋 Generated ${options.queries.length} queries:`);
      options.queries.slice(0, 10).forEach((q, i) => {
        console.log(`   ${i + 1}. ${q}`);
      });
      if (options.queries.length > 10) {
        console.log(`   ... and ${options.queries.length - 10} more`);
      }
      console.log('');
    }
    
    await ingestVideos(options);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
