# Intelligent Video Fetching Strategy

## Overview

The video ingestion system has been redesigned to align with Kitvas's **ingredient-level intelligence** strategy as outlined in the PRD. Instead of using random generic recipe queries, the system now uses multiple intelligent strategies to build the ingredient intelligence moat.

## Key Improvements

### 1. **Ingredient-Based Queries** (Not Recipe Names)

**Before:**
- `"miso pasta recipe"`
- `"gochujang chicken recipe"`
- Generic recipe queries

**After:**
- `"miso pasta"` (ingredient combination)
- `"gochujang chicken"` (ingredient combination)
- Focus on ingredient pairs, not recipe names

**Why:** Builds the ingredient database and enables ingredient-level intelligence.

### 2. **Multiple Query Generation Strategies**

The system now uses 5 intelligent strategies:

#### Strategy 1: Popular Ingredient Combinations
- Curated list of trending ingredient pairs
- Based on food content trends and common pairings
- Always available as fallback

#### Strategy 2: Search Patterns from Database
- Analyzes what users are actually searching for
- Generates queries from ingredient combinations users search
- Builds on real user behavior data

#### Strategy 3: Ingredient Co-Occurrence
- Discovers which ingredients appear together in existing videos
- Uses video data to find natural ingredient pairings
- Leverages the existing video database

#### Strategy 4: YouTube Autocomplete
- Uses YouTube's autocomplete API to discover trending searches
- Finds what people are actually searching for
- Provides real-time demand signals

#### Strategy 5: Gap Opportunities
- Finds ingredient combinations with high search frequency but low video coverage
- Identifies opportunities where demand exceeds supply
- Helps fill gaps in the database

## Usage

### Default (Intelligent Generation)
```bash
npm run ingest:videos
```
Uses all strategies to generate queries automatically.

### Find Gap Opportunities
```bash
npm run ingest:videos -- --gaps
```
Focuses on high-demand, low-supply ingredient combinations.

### Manual Queries (Backward Compatible)
```bash
npm run ingest:videos -- --query "miso pasta" --max 50
npm run ingest:videos -- --queries "miso pasta,gochujang chicken"
```
Still supports manual queries for specific needs.

## How It Builds the Moat

### 1. **Data Network Effects**
- Every search pattern contributes to future query generation
- Ingredient co-occurrence data compounds over time
- More data → better queries → more relevant videos → more data

### 2. **Community Intelligence**
- Uses actual user search patterns
- Discovers what creators are looking for
- Builds proprietary ingredient relationship data

### 3. **Demand Signals**
- YouTube autocomplete provides real-time demand
- Gap detection finds opportunities
- Aligns with PRD's "Demand Intelligence" layer

## Technical Implementation

### Files Created/Modified

1. **`backend/src/lib/query-generator.ts`** (NEW)
   - Core query generation logic
   - All 5 strategies implemented
   - Handles edge cases (empty database, etc.)

2. **`backend/src/lib/youtube.ts`** (MODIFIED)
   - Added `getYouTubeAutocomplete()` function
   - Supports demand signal discovery

3. **`backend/src/scripts/ingest-videos.ts`** (MODIFIED)
   - Integrated intelligent query generation
   - Backward compatible with manual queries
   - Enhanced logging and feedback

## Alignment with PRD

This implementation directly supports:

- **Supply Intelligence**: Ingredient-focused video discovery
- **Demand Intelligence**: YouTube autocomplete + search patterns
- **Data Moat**: Search patterns, co-occurrence, gap detection
- **Community Intelligence**: Uses user search data to improve

## Future Enhancements

Potential improvements:
- Machine learning model to predict best ingredient combinations
- Seasonal ingredient trends
- Cuisine-specific ingredient pairings
- Performance-based query prioritization (ingest videos that perform well)

## Example Output

```
🧠 Using intelligent query generation...
   This builds Kitvas's ingredient-level intelligence moat

📊 Generated 15 queries from popular combinations
🔍 Generated 8 queries from search patterns
🔗 Generated 12 queries from ingredient co-occurrence
💡 Generated 7 queries from YouTube autocomplete
✨ Total unique queries generated: 30

📋 Generated 30 queries:
   1. miso pasta
   2. gochujang chicken
   3. air fryer tofu
   ...
```
