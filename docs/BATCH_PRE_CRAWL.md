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
│                    Daily Batch Job                           │
│  (Runs automatically every day)                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Generate intelligent queries                             │
│     ├─ Popular ingredient combinations                      │
│     ├─ Search patterns from database                        │
│     ├─ Ingredient co-occurrence                            │
│     └─ YouTube autocomplete (demand signals)                 │
│                                                              │
│  2. Fetch videos from YouTube API                           │
│                                                              │
│  3. Extract ingredients immediately                          │
│     ├─ From title (high confidence)                          │
│     └─ From description (medium confidence)                  │
│                                                              │
│  4. Store in database                                        │
│     ├─ Video metadata                                        │
│     └─ Extracted ingredients (linked)                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database                                  │
│                                                              │
│  Videos ──┐                                                  │
│           ├──► VideoIngredients ──► Ingredients              │
│  Searches ──┘                                                  │
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
│  → Return matching videos instantly                          │
│  → No real-time API calls needed                             │
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

#### Using Cron (Linux/Mac)

Add to crontab:
```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/kitvas/backend && npm run batch:daily >> /var/log/kitvas-batch.log 2>&1
```

#### Using systemd Timer (Linux)

Create `/etc/systemd/system/kitvas-batch.service`:
```ini
[Unit]
Description=Kitvas Daily Batch Job
After=network.target

[Service]
Type=oneshot
User=your-user
WorkingDirectory=/path/to/kitvas/backend
ExecStart=/usr/bin/npm run batch:daily
```

Create `/etc/systemd/system/kitvas-batch.timer`:
```ini
[Unit]
Description=Run Kitvas batch job daily at 2 AM

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable:
```bash
sudo systemctl enable kitvas-batch.timer
sudo systemctl start kitvas-batch.timer
```

#### Using GitHub Actions (CI/CD)

Create `.github/workflows/daily-batch.yml`:
```yaml
name: Daily Batch Job

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  batch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
        working-directory: backend
      - run: npm run batch:daily
        working-directory: backend
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
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

## Future Enhancements

1. **ML-Based Extraction**: Replace keyword matching with ML model
2. **Transcript Analysis**: Extract from video transcripts (higher accuracy)
3. **Image Analysis**: Extract from video thumbnails/frames
4. **Incremental Updates**: Only fetch new videos since last run
5. **Priority Queue**: Prioritize high-demand ingredient combinations
6. **Error Recovery**: Retry failed extractions automatically

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
