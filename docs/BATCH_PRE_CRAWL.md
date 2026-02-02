# Batch Pre-Crawl Strategy

## Overview

Kitvas uses a **batch pre-crawl strategy** to build the ingredient intelligence database:

1. **Pre-crawl YouTube videos in batch** (daily job)
2. **Extract ingredients from all videos upfront**
3. **Store everything in database**
4. **When user searches → query pre-extracted data**

This approach ensures fast search responses and enables ingredient-level intelligence.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Centralized Scheduler (node-cron)              │
│  (Runs automatically via PM2 or npm run scheduler)          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1:00 AM - Google Trends Fetch                               │
│     ├─ Fetch trends for top 50 ingredients                  │
│     ├─ Discover related rising queries                      │
│     └─ Store in GoogleTrend table                           │
│                                                              │
│  2:00 AM - Daily Batch Job                                   │
│     ├─ Generate intelligent queries                         │
│     ├─ Fetch videos from YouTube API                        │
│     ├─ Extract ingredients (title/description/transcript)   │
│     └─ Store videos + ingredients in database               │
│                                                              │
│  3:00 AM - Trends Aggregation                                │
│     ├─ Combine Google Trends + YouTube metrics              │
│     ├─ Calculate enhanced demand scores                     │
│     └─ Update DemandSignal table                            │
│                                                              │
│  4:00 AM Sunday - Data Cleanup                               │
│     └─ Clean old cache and processed data                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database                                  │
│                                                              │
│  Videos ──────┬──► VideoIngredients ──► Ingredients         │
│               │                                              │
│  Searches ────┤                                              │
│               │                                              │
│  GoogleTrend ─┴──► DemandSignal (enhanced scores)           │
│                                                              │
│  All data pre-extracted and ready for fast queries          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              User Search (Fast Response)                    │
│                                                              │
│  User searches: ["miso", "pasta"]                            │
│                                                              │
│  → Query pre-extracted VideoIngredients                      │
│  → Combine YouTube metrics + Google Trends                   │
│  → Return enhanced demand intelligence instantly             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Run Daily Batch Job

```bash
# Manual execution
npm run batch:daily

# Or use the ingest script directly
npm run ingest:videos
```

### Automated Daily Execution

Kitvas now includes a **centralized scheduler** that manages all cron jobs in one place using `node-cron`. This is the recommended approach for local development and deployment.

#### Using the Built-in Scheduler (Recommended)

The scheduler runs all scheduled jobs automatically:

```bash
# Start the scheduler (runs all jobs on schedule)
npm run scheduler

# Or run with PM2 for process management (recommended)
pm2 start ecosystem.config.cjs
```

**Scheduled Jobs:**

| Job | Schedule | Description |
|-----|----------|-------------|
| Google Trends Fetch | 1:00 AM | Fetch trending data for top ingredients |
| Daily Batch Job | 2:00 AM | Ingest new YouTube videos |
| Trends Aggregation | 3:00 AM | Aggregate trends data into demand signals |
| Data Cleanup | 4:00 AM (Sunday) | Clean old cache and processed data |

All jobs are defined in `backend/src/scheduler/index.ts`.

#### Using PM2 (Local Development)

PM2 provides process management with automatic restarts:

```bash
cd backend

# Start both API and scheduler
pm2 start ecosystem.config.cjs

# Check status
pm2 status

# View logs
pm2 logs kitvas-scheduler

# Stop all
pm2 stop all
```

The `ecosystem.config.cjs` configures:
- **kitvas-api**: Main backend server on port 4001
- **kitvas-scheduler**: Cron job scheduler

#### Using System Cron (Alternative)

If you prefer system cron over the built-in scheduler:

```bash
# Add to crontab
crontab -e

# Google Trends - 1 AM daily
0 1 * * * cd /path/to/kitvas/backend && npm run trends:daily >> logs/trends.log 2>&1

# Batch job - 2 AM daily
0 2 * * * cd /path/to/kitvas/backend && npm run batch:daily >> logs/batch.log 2>&1

# Trends aggregation - 3 AM daily
0 3 * * * cd /path/to/kitvas/backend && npm run aggregate:trends >> logs/aggregate.log 2>&1
```

#### NPM Scripts for Manual Execution

```bash
# Run individual jobs manually
npm run trends:daily      # Fetch Google Trends
npm run batch:daily       # Ingest YouTube videos
npm run aggregate:trends  # Aggregate trend data
npm run scheduler         # Start the scheduler daemon
```

## Components

### 1. Daily Batch Job (`daily-batch-job.ts`)

Main script that orchestrates the entire batch process:
- Generates intelligent queries
- Fetches videos from YouTube
- Extracts ingredients immediately
- Stores everything in database
- Provides detailed logging and stats

### 2. Ingredient Extractor (`ingredient-extractor.ts`)

Extracts ingredients from video metadata:
- Keyword-based extraction (can be enhanced with ML/NLP)
- Confidence scoring based on source (title vs description)
- Normalizes ingredient names
- Stores in database with confidence scores

### 3. Query Generator (`query-generator.ts`)

Generates intelligent queries for batch crawling:
- Popular ingredient combinations
- Search patterns from user behavior
- Ingredient co-occurrence analysis
- YouTube autocomplete (demand signals)
- Gap opportunities (high demand, low supply)

## Benefits

### 1. **Fast Search Responses**
- All data pre-extracted
- No real-time API calls during search
- Database queries are fast

### 2. **Ingredient Intelligence**
- Builds ingredient database over time
- Tracks ingredient co-occurrence
- Enables ingredient-level insights

### 3. **Scalability**
- Batch processing is more efficient
- Can process thousands of videos daily
- Rate limits handled in batch

### 4. **Data Moat**
- Proprietary ingredient database
- Search patterns inform future crawling
- Compounds over time

## Note: Inline Extraction (New)

As of the latest update, ingredient extraction also happens **inline during search**:

- When users search, fresh YouTube videos are extracted immediately using Groq LLM
- Videos are stored in the database with ingredients right away
- This complements batch pre-crawling by ensuring new videos have ingredient data instantly
- Trade-off: Slightly slower search response (~2-3s) but much better UX

**The batch pre-crawl remains important for:**
- Building the initial database with a large corpus of videos
- Processing videos in bulk efficiently (better rate limit management)
- Filling gaps in coverage systematically
- Running during off-peak hours to minimize user-facing latency

## Monitoring

The batch job provides detailed statistics:

```
═══════════════════════════════════════════════════════════
✨ Batch Job Complete
═══════════════════════════════════════════════════════════
Duration: 245s
Queries generated: 30
Videos fetched: 600
Videos ingested: 587
Videos skipped (already exist): 13
Ingredients extracted: 2,341
Errors: 0

📊 Database Summary:
   Total videos: 15,234
   Videos with ingredients: 14,891
   Total unique ingredients: 342
   Coverage: 98% of videos have ingredients
```

## Transcript Support ✅ (Implemented)

Ingredient extraction now includes YouTube video transcripts for better accuracy:

### How It Works

1. **Transcript Fetching** (`backend/src/lib/transcript-fetcher.ts`)
   - Uses `youtube-transcript` npm package (free, no API quota cost)
   - Fetches English transcripts when available
   - Handles videos without transcripts gracefully

2. **Integration Points**
   - **Search Flow**: Fresh YouTube videos fetch transcripts inline
   - **Background Processing**: Background-processed videos also fetch transcripts
   - **Extraction**: Transcripts passed to Groq LLM for ingredient extraction

3. **Source Tracking**
   - Ingredients from transcripts have `source: 'transcript'`
   - Confidence capped at 0.80 (slightly lower than title/description)
   - Title/description sources take priority over transcript for same ingredient

### Usage

```typescript
import { fetchTranscript } from './lib/transcript-fetcher.js';

// Fetch transcript for a video
const transcript = await fetchTranscript(videoId);
if (transcript) {
  console.log(`Got ${transcript.length} chars of transcript`);
}
```

### Trade-offs

- **Pros**: Better ingredient detection for videos where ingredients are spoken but not in title/description
- **Cons**: Slightly slower processing (~1-2s per video), some videos don't have transcripts
- **Rate Limiting**: 2-second delay recommended between transcript fetches to avoid bot detection

---

## Google Trends Integration ✅ (Implemented)

The batch system now includes Google Trends data for enhanced demand intelligence:

### Data Flow

1. **Daily Trends Fetch** (`backend/src/scripts/fetch-google-trends.ts`)
   - Runs at 1:00 AM before the main batch job
   - Fetches interest data for top 50 ingredients
   - Discovers related rising queries (emerging trends)
   - Stores in `GoogleTrend` and `GoogleTrendRelatedQuery` tables

2. **Trends Aggregation** (`backend/src/scripts/aggregate-trends.ts`)
   - Runs at 3:00 AM after batch job completes
   - Combines Google Trends + YouTube metrics
   - Updates `DemandSignal` table with enhanced scores
   - Identifies breakout ingredients (>5000% growth)

3. **Enhanced Demand Score**
   - YouTube metrics: 70% weight (views, engagement, freshness)
   - Google Trends: 20% weight (external validation)
   - Internal search: 10% weight (user behavior)

### Database Tables

- `GoogleTrend` - Daily interest scores (0-100) per ingredient
- `GoogleTrendRelatedQuery` - Rising/top related queries
- `GoogleTrendsCache` - Response caching to minimize API requests
- `GoogleTrendsJobLog` - Job execution history and monitoring

### Rate Limiting

- 5 requests per minute to Google Trends
- Random 1-3 second delays between requests
- Exponential backoff on 429 errors
- 24-hour cache TTL for daily data

---

## Job Monitoring

All scheduled jobs log their execution status to the `GoogleTrendsJobLog` table:

```typescript
// Check job status
const recentJobs = await prisma.googleTrendsJobLog.findMany({
  where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  orderBy: { createdAt: 'desc' },
});
```

Job statuses:
- `started` - Job began execution
- `completed` - Job finished successfully
- `failed` - Job encountered an error (check `errorMessage`)

---

## Future Enhancements

1. **ML-Based Extraction**: Replace keyword matching with ML model
2. ~~**Transcript Analysis**: Extract from video transcripts (higher accuracy)~~ ✅ Implemented
3. ~~**Google Trends Integration**: External demand validation~~ ✅ Implemented
4. **Image Analysis**: Extract from video thumbnails/frames
5. **Incremental Updates**: Only fetch new videos since last run
6. **Priority Queue**: Prioritize high-demand ingredient combinations
7. **Error Recovery**: Retry failed extractions automatically
8. **Seasonal Pattern Detection**: Mine historical trends for seasonality

## Troubleshooting

### Batch job fails

1. Check database connection: `npm run db:studio`
2. Verify YouTube API key: `echo $YOUTUBE_API_KEY`
3. Check rate limits: YouTube API has daily quotas
4. Review logs for specific errors

### Low ingredient extraction rate

1. Ingredient keywords may need expansion
2. Consider ML-based extraction for better accuracy
3. Check video metadata quality (some videos have minimal descriptions)

### High error rate

1. Check YouTube API quota
2. Verify network connectivity
3. Review rate limiting settings
4. Check database constraints
