/**
 * Video Ingestion Script
 * 
 * This script fetches videos from YouTube API and stores them in the database.
 * Run with: npm run ingest:videos
 * 
 * Usage:
 *   npm run ingest:videos -- --query "miso pasta recipe" --max 50
 *   npm run ingest:videos -- --queries "miso pasta,gochujang chicken,air fryer tofu"
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { searchYouTubeVideos, getVideoDetails } from '../lib/youtube.js';

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
}

async function ingestVideos(options: IngestionOptions) {
  const { queries, maxResultsPerQuery, apiKey } = options;
  
  console.log(`🚀 Starting video ingestion for ${queries.length} search queries...`);
  console.log(`   Max results per query: ${maxResultsPerQuery}`);
  
  let totalIngested = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

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
          await prisma.video.create({
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

          totalIngested++;
          console.log(`   ✅ Stored: "${snippet.title.substring(0, 50)}..."`);
          
          // Rate limiting: YouTube API has quotas
          // Wait 100ms between videos to avoid hitting rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
          
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

  console.log(`\n✨ Ingestion complete!`);
  console.log(`   ✅ Ingested: ${totalIngested} videos`);
  console.log(`   ⏭️  Skipped (already exist): ${totalSkipped} videos`);
  console.log(`   ❌ Errors: ${totalErrors}`);
  
  // Show summary
  const totalVideos = await prisma.video.count();
  console.log(`\n📊 Total videos in database: ${totalVideos}`);
}

// Parse command line arguments
function parseArgs(): IngestionOptions {
  const args = process.argv.slice(2);
  
  let queries: string[] = [];
  let maxResultsPerQuery = 20;
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
    }
  }

  // Default queries if none provided
  if (queries.length === 0) {
    queries = [
      'miso pasta recipe',
      'gochujang chicken',
      'air fryer tofu',
      'vegan pasta recipe',
      'creamy pasta recipe',
    ];
    console.log('📝 No queries provided, using default queries:');
    queries.forEach(q => console.log(`   - ${q}`));
  }

  return {
    queries,
    maxResultsPerQuery,
    apiKey,
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

    const options = parseArgs();
    await ingestVideos(options);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
