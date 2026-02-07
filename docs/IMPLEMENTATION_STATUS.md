# Implementation Status

## Progress Overview

| Week | Focus | Status |
|------|-------|--------|
| Week 1 | Foundation & Data Pipeline | ✅ Complete |
| Week 2 | Ingredient Extraction | ✅ Complete |
| Week 3 | Search Functionality | ✅ Complete |
| Week 4 | Training Data Collection | ✅ Complete |
| Week 5 | ML Models & Improvement | ✅ Complete |
| Week 6 | Demand Intelligence + Corrections | ✅ Complete |
| Week 7 | Opportunities & Tracking | ✅ Complete |
| Week 7+ | ML Training & Analytics | ✅ Complete |
| Week 7++ | Google Trends Integration | ✅ Complete |
| Week 7++ | Automated Cron Scheduling | ✅ Complete |
| Week 8 | Auth (Partial) | ✅ Auth Complete, Payments Pending |
| Week 9 | Trends + Polish + Launch | ⏳ Pending |

---

## ✅ Completed: Week 1-3 (Foundation + Search)

**User Story:** As a Creator, I want to Search by ingredients, So that I can find relevant videos.

### What's Been Implemented

1. **Project Structure** ✅
   - Monorepo setup with workspaces (frontend, backend, shared)
   - Next.js 14 frontend with App Router
   - Hono backend with tRPC
   - TypeScript configuration across all workspaces

2. **Database Schema** ✅
   - Prisma schema with all core tables:
     - Users, Videos, Ingredients, VideoIngredients
     - Searches (for pattern tracking - moat feature)
     - Corrections, TrackedOpportunities, Outcomes (for future features)

3. **Search Backend** ✅
   - tRPC search procedure implemented
   - Ingredient-based search with relevance scoring
   - Search pattern logging (moat contribution)
   - Results ranked by relevance (matching ingredients / total searched)

4. **Search Frontend** ✅
   - Ingredient input component (up to 10 ingredients)
   - Real-time search with tRPC
   - Results display with video cards
   - Loading and error states

---

## ✅ Completed: Week 6 (Demand Intelligence + Corrections)

### Demand Intelligence (Day 1-3) ✅

**YouTube Market-Based Demand System** - Instead of Google Trends (which requires API approval), we built a demand system using YouTube video data that's already fetched. Zero additional API calls.

#### Features Implemented:

1. **Demand Score & Bands**
   - Calculates demand score (0-100) based on views, velocity, and content gaps
   - Demand bands: `hot`, `growing`, `stable`, `niche`, `unknown`
   - Displayed prominently in search results

2. **Market Metrics**
   - Total views, average views, median views
   - Average views per day (velocity)
   - Video count in the niche

3. **Content Gap Analysis**
   - Identifies market opportunities: `underserved`, `saturated`, `balanced`, `emerging`
   - Provides reasoning for each assessment
   - Factors: view concentration, supply vs demand proxy, freshness, velocity

4. **Content Opportunities**
   - `quality_gap`: Top performers dominate, opportunity for quality content
   - `freshness_gap`: Few recent videos despite high views
   - `underserved`: High demand but limited supply
   - `trending`: Emerging topic gaining momentum

5. **Strict 100% Match Filtering**
   - ALL searched ingredients must be present in a video for it to appear in results
   - Videos with `relevanceScore === 1.0` only — no partial matches shown
   - If no videos match all ingredients, the empty state is displayed
   - Applies to both pre-crawled database videos and fresh YouTube results

6. **Minimum 2 Ingredients Required**
   - Search requires at least 2 ingredients (enforced in both backend schema and frontend UI)
   - Search button hidden until 2+ ingredients are added
   - Hint text guides users: "Add at least 2 ingredients to search"
   - Trending ingredient clicks add to input but don't auto-trigger search

8. **Inline Ingredient Extraction for Fresh Videos** (Major Enhancement)
   - **Problem**: Fresh YouTube videos showed without ingredients, relevance scores, or correction system
   - **Solution**: Extract ingredients INLINE when fetching YouTube results (not in background queue)
   - **Flow**:
     1. Fetch YouTube videos
     2. For each new video (up to 10), extract ingredients using Groq LLM
     3. Store video and ingredients in database immediately
     4. Return as analyzed videos with full ingredient data
   - **Result**: ALL videos now show ingredients, relevance scores, and correction buttons
   - **Trade-off**: Slightly slower search response (~2-3s more), but much better UX
   - **Files Modified**: `backend/src/routers/search.ts` - inline extraction instead of background queue

#### Files Modified:
- `backend/src/lib/youtube-demand-calculator.ts` - New demand calculation logic
- `backend/src/routers/search.ts` - Integration with search results
- `frontend/src/lib/trpc.ts` - Type definitions for demand signals
- `frontend/src/components/SearchResults.tsx` - DemandBadge and Opportunities display

---

### Correction System (Day 4-7) ✅ **MOAT FEATURE**

**Ingredient Correction System** - Users can correct ingredient detection errors, creating labeled training data that improves the model for everyone.

#### Features Implemented:

1. **Correction Buttons on Ingredients**
   - "This is right" / "This is wrong" buttons on each detected ingredient
   - Confidence indicator (dots: ●●●●○)
   - Click-to-expand correction actions

2. **Correction Submission**
   - tRPC `corrections.submit` mutation
   - Actions: `wrong`, `right`, `add`, `rename`
   - Stores corrections with user, video, ingredient, and action

3. **Confidence Adjustment**
   - "Wrong" decreases ingredient confidence by 0.1
   - "Right" increases ingredient confidence by 0.05
   - Confidence clamped between 0 and 1

4. **Impact Visibility**
   - Shows user how many videos their correction affects
   - Feedback message: "Thanks! Your correction affects X videos."

5. **Add Missing Ingredient**
   - `corrections.addIngredient` mutation
   - Creates ingredient if it doesn't exist
   - Links to video with `user_correction` source

6. **User Stats**
   - `corrections.getStats` query
   - Total corrections, total impact (videos affected)
   - Recent corrections with video/ingredient names

#### Files Created/Modified:
- `backend/src/routers/corrections.ts` - Full corrections router
- `frontend/src/components/SearchResults.tsx` - IngredientTag component with correction UI

---

### Search Input UX Fix

**Space Key Behavior** - Fixed confusing space key behavior in ingredient input.

- **Before**: Space key submitted ingredient (same as Enter)
- **After**: Space key adds a comma, helping users understand comma-separated format
- **Updated placeholder**: "Type ingredients (space adds comma, enter to search)"

#### File Modified:
- `frontend/src/components/SearchInput.tsx` - handleKeyDown logic

---

## ✅ Completed: Week 7 (Opportunities & Tracking)

### Opportunity Detection (Day 1-3) ✅

Opportunity scoring is integrated with the demand intelligence system from Week 6. Content opportunities (quality_gap, freshness_gap, underserved, trending) are already displayed in search results.

### Opportunity Tracking ⭐ **MOAT FEATURE** ✅

**Track opportunities directly from search results** - Users can track promising recipe combinations and follow them through their content pipeline.

#### Features Implemented:

1. **Track Button on Opportunity Cards**
   - One-click tracking from search results
   - Captures ingredients, opportunity score, and search context
   - Success/error feedback on tracking

2. **My Opportunities Page** (`/opportunities`)
   - View all tracked opportunities
   - Active opportunities (researching, filming)
   - Completed opportunities (published, abandoned)
   - Free tier limit indicator (5 active max)

3. **Status Tracking**
   - Status flow: `researching` → `filming` → `published` → `abandoned`
   - One-click status progression
   - Visual status indicators

4. **Free Tier Limits Enforced**
   - 5 active opportunities max for free users
   - Clear limit indicator on My Opportunities page
   - Upgrade prompt when limit reached

#### Files Created:
- `backend/src/routers/opportunities.ts` - Full opportunities tRPC router
- `frontend/src/components/MyOpportunitiesPage.tsx` - My Opportunities page
- `frontend/src/app/opportunities/page.tsx` - Route handler

#### Files Modified:
- `backend/src/router.ts` - Added opportunities router
- `frontend/src/components/SearchResults.tsx` - Added Track button to OpportunityCard
- `frontend/src/components/SearchPage.tsx` - Added navigation to My Opportunities

---

### Outcome Reporting ⭐ **MOAT FEATURE** ✅

**Report video performance after publishing** - Critical for calibrating opportunity accuracy scores over time.

#### Features Implemented:

1. **Outcome Reporting Form**
   - Video URL (optional)
   - 7-day views count (optional)
   - Rating (1-5 stars)
   - "Did not publish" option

2. **Pending Outcomes Alert**
   - Shows count of opportunities ready for reporting
   - Appears on My Opportunities page

3. **Outcome Stats**
   - `outcomes.getStats` - Personal outcome statistics
   - `outcomes.getCommunityStats` - Community-wide statistics (for calibration)

4. **tRPC Outcome Router**
   - `submit` - Submit outcome for tracked opportunity
   - `getStats` - Get user's outcome stats
   - `getCommunityStats` - Get community outcome stats

#### Files Created:
- `backend/src/routers/outcomes.ts` - Full outcomes tRPC router

#### Files Modified:
- `backend/src/router.ts` - Added outcomes router

---

### Backend API Routes

#### Opportunities Router (`opportunities`)
- `track` - Track a new opportunity
- `updateStatus` - Update opportunity status
- `list` - List user's opportunities
- `delete` - Remove tracked opportunity
- `getPendingOutcomes` - Get opportunities ready for outcome reporting

#### Outcomes Router (`outcomes`)
- `submit` - Submit outcome report
- `getStats` - Get user's outcome statistics
- `getCommunityStats` - Get community statistics

---

## ✅ Completed: Week 5 (ML Models & Improvement)

### Ingredient Synonym Mapping & Normalization ✅

**Comprehensive ingredient normalization system** - Maps ingredient variations to canonical forms, improving extraction accuracy and search matching.

#### Features Implemented:

1. **Synonym Mapping** (`ingredient-synonyms.ts`)
   - 100+ canonical ingredient entries with synonym variants
   - Handles plurals (tomatoes -> tomato), qualifiers (fresh basil -> basil)
   - Reverse lookup map for efficient O(1) normalization
   - Helper functions: `isSameIngredient()`, `getSynonyms()`, `getAllCanonicalNames()`

2. **Improved LLM Extraction Prompt**
   - Enhanced system message with strict extraction rules
   - Canonical singular form instructions (e.g., "tomato" not "tomatoes")
   - Clear inclusion/exclusion criteria (ingredients vs equipment/methods/dishes)
   - Post-extraction deduplication after normalization

### Tag Detection System ✅

**Automatic tag extraction for cooking methods, dietary info, and cuisine types** - Enriches video data with structured tags for filtering.

#### Features Implemented:

1. **Tag Extractor Module** (`tag-extractor.ts`)
   - Keyword dictionaries for cooking methods, dietary, and cuisine categories
   - LLM-based extraction (Groq) with keyword fallback
   - Combined approach: LLM results merged with keyword detections
   - Confidence scoring (LLM: 0.85-0.90, keywords: 0.70)

2. **Tag Categories**
   - **Cooking Methods**: air fryer, oven, stovetop, grill, instant pot, slow cooker, no cook
   - **Dietary**: vegan, vegetarian, gluten-free, keto, dairy-free, low calorie
   - **Cuisine**: korean, japanese, italian, mexican, indian, thai, chinese, mediterranean

3. **Database Storage**
   - `VideoTag` model with unique constraint on (videoId, tag)
   - Indexes on videoId, tag, and category for efficient queries
   - Integrated into inline extraction during search

4. **Tag Filtering in Search**
   - Tags passed as optional `tags` array in search input
   - Database-level filtering via `videoTags.some` Prisma query
   - Combined with ingredient search for precise results

5. **Frontend Tag UI**
   - `TagFilterGroup` component with color-coded categories (purple/green/orange)
   - Toggle tags on/off with visual active state
   - Active filters display with individual remove and "Clear all"
   - Tag badges on video cards in search results

### Accuracy Measurement ✅

**Script to measure extraction accuracy against labeled ground truth** - Validates extraction quality meets the >70% F1 target.

#### Features:
- Compares current extraction against labeled videos
- Calculates precision, recall, F1 score per video and overall
- Reports exact match rate and score distribution
- Identifies low-scoring videos for investigation
- CLI with `--limit` flag: `npm run accuracy` or `npm run accuracy -- --limit 50`

#### Schema Changes

- Added `VideoTag` model (id, videoId, tag, category, confidence)
- Unique constraint on `[videoId, tag]`
- Indexes on videoId, tag, category

#### Files Created

- `backend/src/lib/ingredient-synonyms.ts` - Synonym mapping and normalization
- `backend/src/lib/tag-extractor.ts` - Tag extraction module
- `backend/src/scripts/measure-accuracy.ts` - Accuracy measurement script

#### Files Modified

- `backend/src/lib/ingredient-extractor.ts` - Enhanced LLM prompt, synonym normalization, deduplication
- `backend/src/routers/search.ts` - Tag extraction integration, tag filtering, tags in response
- `backend/prisma/schema.prisma` - Added VideoTag model
- `backend/package.json` - Added `accuracy` npm script
- `frontend/src/lib/trpc.ts` - Added VideoTag type
- `frontend/src/components/SearchInput.tsx` - Tag filter UI with TagFilterGroup
- `frontend/src/components/SearchResults.tsx` - Tag badges on video cards

---

## ✅ Completed: Week 4 (Training Data Collection)

### Admin Labeling Tool ✅

**Training data labeling interface** - Admin tool for reviewing, correcting, and verifying ingredient extraction on videos. Builds the labeled dataset needed for model improvement.

#### Features Implemented:

1. **Video Browser with Filters**
   - Paginated list of extracted videos
   - Filter by: unlabeled, labeled, all
   - Search by video title
   - Shows ingredient count, correction count, and labeled status

2. **Ingredient Editor**
   - View all detected ingredients with confidence scores and source
   - Add missing ingredients (confidence: 1.0, source: `admin_label`)
   - Remove incorrect ingredients
   - Rename ingredients (creates new ingredient if needed)
   - Hover-to-reveal edit actions

3. **Labeling Workflow**
   - Select video from list, editor panel opens
   - Review/correct ingredients
   - Mark as "Labeled" when verified
   - Unmark to re-review
   - Progress stats (total, labeled, unlabeled, % progress)

4. **Recent Corrections Display**
   - Shows last 10 corrections made on the video by any user
   - Helps admin understand what users have already flagged

#### Dataset Export ✅

1. **Full Export**
   - Export as JSON (structured with ingredients, confidence, source)
   - Export as CSV (flat format for spreadsheet analysis)
   - Filter: labeled only or all extracted videos

2. **Train/Validation/Test Split**
   - Configurable ratios (default: 70/15/15)
   - Reproducible splits via random seed
   - Validates minimum test ratio (5%)
   - Exports single JSON with train/validation/test arrays and stats

3. **Dataset Statistics**
   - Total videos, labeled count, progress percentage
   - Top 20 most common ingredients with counts
   - Total corrections count

#### Schema Changes

- Added `labeledAt` (DateTime?) to Video model - when video was labeled
- Added `labeledBy` (String?) to Video model - who labeled it
- Added index on `labeledAt` for efficient filtering

#### Files Created

- `backend/src/routers/admin.ts` - Full admin tRPC router (getVideos, getVideo, markLabeled, unmarkLabeled, addIngredient, removeIngredient, renameIngredient, setConfidence, getStats, exportJSON, exportCSV, exportSplit)
- `frontend/src/components/AdminLabelingPage.tsx` - Labeling UI with video list + editor
- `frontend/src/components/AdminExportPage.tsx` - Export page with download options
- `frontend/src/app/admin/label/page.tsx` - Admin labeling route
- `frontend/src/app/admin/label/export/page.tsx` - Admin export route

#### Files Modified

- `backend/src/router.ts` - Added admin router
- `backend/prisma/schema.prisma` - Added labeledAt, labeledBy fields to Video
- `frontend/src/components/SearchPage.tsx` - Added Admin Labeling nav link

#### Routes

- `/admin/label` - Admin labeling interface
- `/admin/label/export` - Dataset export page

---

## ✅ Completed: ML Training & Analytics System

### Analytics Infrastructure ✅

**New Database Models** (schema.prisma):
- `IngredientTrend` - Tracks ingredient popularity over time (daily/weekly/monthly)
- `ExtractionFeedback` - Aggregates correction patterns for extraction improvement
- `OpportunityCalibration` - Stores prediction accuracy metrics by demand band + score
- `AccuracySnapshot` - Historical extraction accuracy tracking (precision/recall/F1)

**Analytics Router** (`backend/src/routers/analytics.ts`):
- `trending` - Top ingredients by search volume with growth % (7d/30d/90d)
- `seasonal` - Ingredient popularity by month for planning
- `contentGaps` - Underserved ingredient combinations (high search, low video)
- `coOccurrence` - Ingredients frequently searched together
- `extractionAccuracy` - Precision/recall/F1 metrics with history
- `opportunityCalibration` - Prediction accuracy data by tier
- `dashboard` - Single endpoint for insights UI
- `exportCorrections` - Training data export
- `extractionFeedback` - Feedback patterns for prompt improvement

### Extraction Improvement System ✅

**Dynamic Feedback Loop** (`backend/src/lib/ingredient-extractor.ts`):
- Dynamic blocklist populated from ExtractionFeedback (false positives)
- Dynamic allowlist for commonly missed ingredients (false negatives)
- Rename mappings from user corrections
- LLM prompt enhancement with blocklist items as negative examples
- Auto-refresh every hour from database

**Correction Aggregation** (`backend/src/scripts/aggregate-corrections.ts`):
- Analyzes corrections to identify extraction patterns
- Groups by action type (wrong/add/rename)
- Generates prompt improvement suggestions
- Tracks pattern occurrences for threshold-based inclusion

### Opportunity Calibration ✅

**Calibration Script** (`backend/src/scripts/calibrate-opportunities.ts`):
- Correlates predicted opportunity scores with actual outcomes
- Groups by (demandBand, opportunityScore) buckets
- Calculates success rates, avg views, avg ratings
- Provides calibration accuracy analysis

**Opportunity Classifier** (`backend/src/lib/opportunity-classifier.ts`):
- Rule-based classifier using calibration data
- Confidence scoring based on actual outcomes
- Human-readable reasoning for each classification
- No external ML dependencies (pure TypeScript)

### Trend Aggregation ✅

**Aggregation Script** (`backend/src/scripts/aggregate-trends.ts`):
- Daily, weekly, monthly trend aggregation
- Backfill support (`--backfill=30` for historical data)
- Ingredient popularity tracking over time
- Video count and average views per ingredient

### Transcript-First Extraction ✅

**YouTube Transcript Fetching** (`backend/src/lib/transcript-fetcher.ts`):
- Fetches transcripts using `youtube-transcript` package
- No YouTube API quota cost (free, unofficial API)
- Integrated into search flow, batch processing, and background processing
- **Transcripts are the PRIMARY extraction source** (confidence 0.95)
- Title/description extraction is supplementary (confidence 0.75)
- When no transcript available, title/description fallback uses confidence 0.85

### Title-Based Supplementary Matching ✅

**Title matching augments ingredient detection** (`backend/src/routers/search.ts`):
- `titleContainsIngredient()` helper checks video titles for ingredient names
- Synonym expansion via `getSynonyms()` — e.g., "kofte" matches "kofta", "kofte", "köfte"
- Videos matching ingredients in title get boosted relevance scores
- Enables matching dish names and ingredients that appear in titles but not in extracted ingredient lists

#### Files Created

- `backend/src/routers/analytics.ts` - Full analytics tRPC router
- `backend/src/scripts/aggregate-trends.ts` - Daily trend aggregation
- `backend/src/scripts/aggregate-corrections.ts` - Correction pattern extraction
- `backend/src/scripts/calibrate-opportunities.ts` - Weekly calibration
- `backend/src/lib/opportunity-classifier.ts` - Rule-based classifier
- `backend/src/lib/transcript-fetcher.ts` - YouTube transcript fetching

#### Files Modified

- `backend/prisma/schema.prisma` - Added IngredientTrend, ExtractionFeedback, OpportunityCalibration, AccuracySnapshot models
- `backend/src/router.ts` - Added analytics router
- `backend/src/lib/ingredient-extractor.ts` - Dynamic blocklist, enhanced prompts, transcript support
- `backend/src/routers/search.ts` - Transcript fetching for fresh videos
- `backend/src/lib/background-processor.ts` - Transcript support for background videos

#### Scripts for Cron Jobs

```bash
# Daily: Aggregate trends and corrections
npx tsx src/scripts/aggregate-trends.ts
npx tsx src/scripts/aggregate-corrections.ts

# Weekly: Calibrate opportunity predictions
npx tsx src/scripts/calibrate-opportunities.ts

# Backfill: Historical trend data
npx tsx src/scripts/aggregate-trends.ts --backfill=30
```

---

## ✅ Completed: Google Trends Integration

### Overview

Incorporated daily Google Trends data into Kitvas to boost demand signal accuracy, validate trending topics with external data, and discover emerging ingredient trends.

### Database Schema Additions ✅

**New Tables:**
- `GoogleTrend` - Stores Google Trends interest over time data (0-100 score)
- `GoogleTrendRelatedQuery` - Stores rising/top related queries for trend discovery
- `GoogleTrendsCache` - Multi-layer caching to minimize API requests
- `GoogleTrendsJobLog` - Job execution logging for monitoring

**Modified Tables:**
- `DemandSignal` - Added `googleTrendsScore`, `googleTrendsGrowth`, `googleTrendsBreakout`, `googleTrendsFetchedAt`

### Files Created

| File | Purpose |
|------|---------|
| `backend/src/lib/google-trends/client.ts` | HTTP client for Google Trends |
| `backend/src/lib/google-trends/fetcher.ts` | High-level fetcher with rate limiting |
| `backend/src/lib/google-trends/rate-limiter.ts` | Token bucket (5 req/min) |
| `backend/src/lib/google-trends/cache.ts` | Multi-layer caching |
| `backend/src/scripts/fetch-google-trends.ts` | Daily batch script |

### Demand Score Integration ✅

**New Weight Distribution:**
| Factor | Previous | New (with Trends) |
|--------|----------|-------------------|
| View Performance | 40% | 30% |
| Content Gap | 35% | 30% |
| Velocity | 15% | 10% |
| Freshness | 10% | 10% |
| **Google Trends** | 0% | **20%** |

### New Opportunity Types ✅

- `google_breakout` - Ingredient experiencing explosive growth (>5000%) on Google Trends
- `velocity_mismatch` - Google searches growing faster than YouTube video supply

### Hot Ingredients UI ✅

**New Component:** `TrendingIngredients.tsx`
- Displays trending ingredients on home page
- Three time periods: Today, This Week, This Month
- Shows interest score, growth percentage, and BREAKOUT badges
- Click ingredient to search

**New Endpoint:** `analytics.hotIngredients`
- Returns top ingredients by Google Trends interest
- Calculates growth vs previous period
- Identifies breakout trends

### Deep Insights Integration ✅

1. **Gap Score Boosting** - Trending ingredients get multiplied gap scores
   - Breakout: 2.0x multiplier
   - Strong growth (>30%): 1.5x multiplier
   - Moderate growth (>10%): 1.25x multiplier
   - Declining (<-20%): 0.75x multiplier

2. **Content Angle Suggestions** - New `analytics.relatedAngles` endpoint
   - Surfaces rising Google Trends queries as content suggestions
   - Shows growth percentage and content angle recommendations

3. **Trends Insight Display** - IngredientGaps component shows:
   - Trends growth percentage indicators
   - BREAKOUT badges for explosive trends
   - Visual highlighting for trending ingredients

### Files Modified

- `backend/src/lib/youtube-demand-calculator.ts` - Added TrendsBoost interface, new opportunity types
- `backend/src/routers/analytics.ts` - Added hotIngredients, relatedAngles endpoints
- `backend/src/routers/gaps.ts` - Added trends boost multiplier to gap scores
- `frontend/src/components/SearchResults.tsx` - Integrated ContentAngles component
- `frontend/src/components/IngredientGaps.tsx` - Added trends badges and insights
- `frontend/src/lib/trpc.ts` - Updated OpportunityType

---

## ✅ Completed: Automated Cron Job Scheduling

### Overview

All batch jobs and maintenance scripts now run automatically via a centralized cron scheduler. No manual command execution needed.

### Scheduler System ✅

**Core Files:**
- `backend/src/cron/config.ts` - Central job configuration with schedules and timeouts
- `backend/src/cron/scheduler.ts` - Node.js daemon that runs jobs on schedule
- `backend/ecosystem.config.cjs` - PM2 configuration for running scheduler locally

### Scheduled Jobs

| Job | Schedule (UTC) | Description |
|-----|----------------|-------------|
| `aggregate-trends` | Daily 12:10 AM | Aggregate search trends |
| `trends-hourly` | Hourly at :00 | Fetch Google Trends data (worldwide region, 1h cache) |
| `batch-daily` | Daily 2:00 AM | Video processing & demand calculation |
| `refresh-views` | Sunday 3:00 AM | Refresh YouTube view counts |
| `aggregate-corrections` | Monday 4:00 AM | Aggregate ML corrections |
| `calibrate-opportunities` | Tuesday 5:00 AM | Calibrate opportunity scoring |
| `fetch-ingredients` | Wednesday 6:00 AM | Fetch ingredients from Wikidata |

### NPM Scripts Added

```bash
# Scheduler commands
npm run scheduler        # Start the scheduler daemon
npm run scheduler:list   # List all configured jobs
npm run scheduler:once   # Run all jobs once (testing)
npm run scheduler:run <job>  # Run a specific job

# Individual job scripts
npm run trends:hourly             # Fetch Google Trends (worldwide, hourly)
npm run aggregate:trends
npm run refresh:views
npm run aggregate:corrections
npm run calibrate:opportunities
```

### Local Deployment (PM2)

```bash
# Start both API and scheduler
pm2 start ecosystem.config.cjs

# View status
pm2 status

# View logs
pm2 logs kitvas-scheduler
```

### Job Logging

All job executions are logged to `GoogleTrendsJobLog` table:
- Job name and type
- Status (started/completed/failed)
- Duration in seconds
- Error messages (if any)
- Timestamp

---

## ✅ Completed: Week 8 (Authentication)

### Authentication Implementation ✅

**NextAuth v5 + Google OAuth** — Full authentication bridge between frontend and backend.

#### What's Implemented

1. **Frontend Auth (NextAuth v5)**
   - Google OAuth sign-in via NextAuth v5 (beta.30)
   - Session management with encrypted JWT (JWE) cookies
   - Cookie name: `authjs.session-token` (dev) / `__Secure-authjs.session-token` (prod)
   - Token passed to backend via `Authorization: Bearer <token>` in tRPC headers

2. **Backend JWT Verification**
   - `jose` library decrypts NextAuth JWE tokens (NOT signed JWT — uses `jwtDecrypt`, not `jwtVerify`)
   - Key derivation: `hkdf('sha256', AUTH_SECRET, '', 'Auth.js Generated Encryption Key', 64)`
   - User upsert on first authenticated request
   - `ctx.userId` and `ctx.userEmail` populated for all authenticated requests

3. **Shared tRPC Procedures** (`backend/src/trpc.ts`)
   - `t.procedure` (public) — no auth required
   - `protectedProcedure` — requires authenticated user (`ctx.userId` must be set)
   - `adminProcedure` — requires admin email allowlist

4. **Router Auth Assignments**

   | Router | Procedure | Endpoints |
   |--------|-----------|-----------|
   | search | public | search, autocomplete |
   | analytics | public | all analytics endpoints |
   | gaps | public | content gaps |
   | corrections | public | submit, addIngredient |
   | corrections | protected | getStats |
   | opportunities | protected | track, list, updateStatus, delete, getPendingOutcomes |
   | outcomes | protected | submit, getStats |
   | outcomes | public | getCommunityStats |
   | admin | admin | all 12 admin endpoints |

5. **Architecture**
   - All routers import from shared `backend/src/trpc.ts` (avoids circular dependencies)
   - `backend/src/router.ts` only imports `t` and composes the app router
   - Admin email hardcoded in `trpc.ts` (planned migration to DB-driven roles)

#### Files Created/Modified
- `backend/src/trpc.ts` — Shared tRPC instance with procedure definitions
- `backend/src/context.ts` — JWT verification, user upsert, ctx population
- `backend/src/router.ts` — Simplified to import `t` from trpc.ts
- `backend/src/routers/*.ts` — All 7 routers updated to import from trpc.ts
- `frontend/src/app/providers.tsx` — Auth cookie reading and Bearer token injection
- `backend/.env` — Added `AUTH_SECRET`
- `frontend/.env` — Added `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`

### Payments (Pending)
- [ ] Integrate Stripe
- [ ] Build subscription plans (Free/Pro)
- [ ] Create checkout flow
- [ ] Enforce feature limits

---

## 🔜 Next: Week 9 (Polish + Launch)

### Remaining Work
- [ ] Stripe integration for subscriptions
- [ ] Analytics dashboard frontend page
- [ ] User profile/stats page
- [ ] Community accuracy display on opportunities page
- [ ] Search rate limiting enforcement
- [ ] Polish and bug fixes
- [ ] Production deployment

---

## Current Limitations
- **No payments**: Stripe integration pending (free tier limits enforced via code but no upgrade path)
- **No analytics page**: Backend API complete, frontend page not yet built
- **No channel benchmarking**: Requires YouTube OAuth (V1.1)

### Files Created

**Root:**
- `package.json` - Workspace configuration
- `README.md` - Project overview
- `SETUP.md` - Setup instructions
- `.gitignore` - Git ignore rules

**Backend:**
- `backend/package.json` - Backend dependencies
- `backend/src/index.ts` - Hono server entry point
- `backend/src/router.ts` - tRPC router
- `backend/src/context.ts` - tRPC context
- `backend/src/routers/search.ts` - Search router implementation
- `backend/src/lib/youtube.ts` - YouTube API helpers
- `backend/prisma/schema.prisma` - Database schema

**Frontend:**
- `frontend/package.json` - Frontend dependencies
- `frontend/src/app/layout.tsx` - Root layout
- `frontend/src/app/page.tsx` - Home page
- `frontend/src/app/providers.tsx` - tRPC providers
- `frontend/src/components/SearchPage.tsx` - Main search page
- `frontend/src/components/SearchInput.tsx` - Ingredient input
- `frontend/src/components/SearchResults.tsx` - Results display
- `frontend/src/lib/trpc.ts` - tRPC types

**Shared:**
- `shared/package.json` - Shared package
- `shared/src/types.ts` - Shared TypeScript types

### Testing the Search

Once database is set up with video data:

1. Start dev servers: `npm run dev`
2. Navigate to http://localhost:3000
3. Enter ingredients (e.g., "miso", "pasta")
4. See results ranked by relevance

### Moat Features Implemented

✅ **Search Pattern Tracking**: Every search is logged to the database, contributing to the data moat. This happens automatically - no user action needed.

This aligns with the PRD's moat strategy: "Every search contributes to ingredient co-occurrence data."
