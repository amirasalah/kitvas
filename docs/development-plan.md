# Kitvas V1: Development Plan

**Version:** 1.0  
**Based on:** Kitvas V1 PRD v2.0  
**Timeline:** 9 weeks  
**Commitment:** 15-20 hours/week

---

## Table of Contents

### Part I: V1 Development Plan (Weeks 1-9)

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Development Phases](#3-development-phases)
4. [Week-by-Week Breakdown](#4-week-by-week-breakdown)
5. [Technical Architecture](#5-technical-architecture)
6. [Data Models](#6-data-models)
7. [API Design](#7-api-design)
8. [Testing Strategy](#8-testing-strategy)
9. [Deployment Plan](#9-deployment-plan)
10. [Risk Mitigation](#10-risk-mitigation)
11. [V1 Success Criteria](#11-v1-success-criteria)
12. [V1 Notes & Considerations](#12-v1-notes--considerations)

### Part II: Future Versions (V1.1+)

13. [Post-Launch Roadmap](#13-post-launch-roadmap)
14. [Future Developments / Deferred Features](#14-future-developments--deferred-features)

---

## 1. Overview

### 1.1 Development Approach

**Principle:** Build the moat foundation early, ship value quickly.

- **Week 1-3:** Foundation + Core Data Pipeline
- **Week 4-5:** ML/Extraction + Training Data
- **Week 6-7:** Intelligence Layers + User Features
- **Week 8:** Auth + Payments
- **Week 9:** Polish + Launch

### 1.2 Key Deliverables

| Phase | Deliverable | Success Criteria |
|-------|-------------|------------------|
| Week 3 | Working search | Users can search by ingredients, see results |
| Week 5 | ML extraction | Ingredient detection accuracy >70% |
| Week 7 | Full feature set | All V1 features functional |
| Week 9 | Production launch | 50 beta users onboarded |

### 1.3 Moat Foundation (Critical Path)

These features must be built early to start the flywheel:

1. **Search Pattern Capture** (Week 3) - Every search contributes data
2. **Correction System** (Week 6) - Users label training data
3. **Outcome Tracking** (Week 7) - Calibration loop begins

---

## 2. Technology Stack

### 2.1 Frontend

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Framework | Next.js 14 (App Router) | SSR, SEO, performance |
| UI Library | Tailwind CSS + shadcn/ui | Fast, customizable components |
| State Management | React Context + Zustand | Simple, efficient |
| Forms | React Hook Form + Zod | Validation + type safety |

### 2.2 Backend

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Framework | Hono | Fast, edge-ready, TypeScript-first |
| API Layer | tRPC | End-to-end type safety between frontend/backend |
| Database | PostgreSQL (Supabase) | Relational, managed |
| ORM | Prisma | Type-safe, migrations |
| Queue | BullMQ + Redis | Background jobs |
| Search | PostgreSQL Full-Text | Sufficient for MVP, can add Algolia later if needed |

### 2.3 ML/Data Processing

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Extraction | Anthropic Claude API | Fast iteration, good accuracy, cost-effective |
| Training | Python scripts (separate) | Model improvement |
| Storage | Supabase Storage | Video metadata, thumbnails |

### 2.4 External APIs

| Service | Purpose |
|---------|---------|
| YouTube Data API v3 | Video metadata, search |
| Anthropic Claude API | Ingredient extraction from video metadata |
| Google Trends RSS Feed | Demand signals (official, ToS compliant) |
| Stripe API | Payments |
| Google OAuth | Authentication |

### 2.5 Infrastructure

| Component | Technology | Notes |
|-----------|-----------|------|
| Hosting | Railway (single service, monorepo) | Deploy frontend + backend together initially, split later if needed |
| Database | Supabase (PostgreSQL) | - |
| Redis | Upstash (serverless) | Pay-per-use, for queue system only (rate limiting uses database) |
| File Storage | Supabase Storage | - |
| Email Service | Resend | Transactional emails, outcome reminders, free tier available |
| Monitoring | Sentry (free tier) | Error tracking only for launch, Grafana deferred to V1.1 |

### 2.6 Architecture Notes

**Frontend-Backend Architecture (V1 - Monorepo):**
- **Structure**: Monorepo with frontend and backend in same repository
- **Deployment**: Single Railway service, both apps deployed together
- **Communication**: tRPC for end-to-end type safety
- **Benefits**: Lower cost ($5-20/month vs $10-40/month), simpler deployment
- **Future**: Split into separate services when scaling (V1.1+)

**Note**: While frontend and backend are separate apps, they're deployed as a monorepo initially for cost efficiency.

**Why Hono over Next.js API Routes:**
- Better separation of concerns
- Can scale backend independently
- Works on edge runtimes (Cloudflare Workers, etc.)
- More flexibility for future backend needs

**LLM Integration:**
- Using Anthropic Claude API for all ingredient extraction tasks
- Claude provides excellent accuracy for structured extraction
- Cost-effective with per-token pricing
- API integrates well with Hono backend

---

## 3. Development Phases

### Phase 1: Foundation (Week 1-3)
**Goal:** Data pipeline working, basic search functional

### Phase 2: Intelligence (Week 4-6)
**Goal:** Ingredient extraction + demand signals + corrections

### Phase 3: Features (Week 7)
**Goal:** Opportunities, tracking, outcomes

### Phase 4: Polish (Week 8-9)
**Goal:** Auth, payments, launch-ready

---

## 4. Week-by-Week Breakdown

### Week 1: Foundation & Data Pipeline ✅ COMPLETE

#### Objectives
- Set up project structure
- Database schema designed and implemented
- YouTube API integration working
- Basic data ingestion pipeline

#### Tasks

**Day 1-2: Project Setup** ✅
- [x] Initialize Next.js project with TypeScript (frontend)
- [x] Set up Hono API server (backend)
- [x] Set up tRPC with Hono adapter (fetch adapter)
- [x] Set up Tailwind CSS
- [x] Configure ESLint, TypeScript
- [x] Set up database (PostgreSQL with Prisma)
- [x] Configure environment variables

**Day 3-4: Database Schema** ✅
- [x] Design schema (users, videos, ingredients, searches, corrections, opportunities, outcomes)
- [x] Implement Prisma schema
- [x] Run initial migrations
- [x] Search pattern tracking ready

**Day 5-7: YouTube API Integration** ✅
- [x] Set up YouTube Data API credentials
- [x] Build video search function (searchYouTubeVideos)
- [x] Build video metadata fetcher (getVideoDetails with statistics)
- [x] Store videos in database
- [x] Background extraction queue for new videos

#### Deliverables
- [x] Working Next.js app
- [x] Database connected
- [x] Can fetch and store YouTube videos

#### Moat Contribution
- Search pattern tracking schema ready

---

### Week 2: Ingredient Extraction ✅ COMPLETE

#### Objectives
- Extract ingredients from video metadata (title, description)
- Display extracted ingredients
- Build extraction queue/job system

#### Tasks

**Day 1-3: Extraction Logic** ✅
- [x] Design ingredient extraction prompt (Claude API)
- [x] Build extraction function (title + description → ingredients)
- [x] Add confidence scoring
- [x] Store ingredients in database (video_ingredients table)
- [x] Handle extraction errors

**Day 4-5: Queue System** ✅
- [x] Create extraction queue (extraction-queue.ts)
- [x] Background worker for processing new videos
- [x] Batch processing (5 videos at a time)
- [x] Error handling with console logging

**Day 6-7: Display & Testing** ✅
- [x] Display extracted ingredients on video cards
- [x] Show confidence indicators (●●●●○)
- [x] Ingredients clickable with correction actions

#### Deliverables
- [x] Ingredients extracted from video metadata
- [x] Extraction pipeline working
- [x] Ingredients displayed with confidence

#### Moat Contribution
- Ingredient data collection begins

---

### Week 3: Search Functionality ✅ COMPLETE

#### Objectives
- Build ingredient-based search
- Rank results by relevance
- Track search patterns

#### Tasks

**Day 1-3: Search Backend** ✅
- [x] Build search query (ingredient matching via Prisma)
- [x] Implement relevance scoring (matching ingredients / total searched)
- [x] Track searches (log to database with ingredients array)
- [x] Add search caching (in-memory cache with 5 min TTL)
- [x] Implement rate limiting (10 YouTube searches/hour)

**Day 4-5: Search Frontend** ✅
- [x] Build search input (ingredient chips/tags, up to 10)
- [x] Display search results (video cards with thumbnails)
- [x] Show detected ingredients per video with confidence
- [x] Add loading states
- [x] Space key adds comma (UX improvement)

**Day 6-7: Search Patterns** ✅
- [x] Log search queries (user_id, ingredients, timestamp)
- [x] Search patterns stored in database for analytics

#### Deliverables
- [x] Users can search by ingredients
- [x] Results ranked by relevance
- [x] Search patterns tracked

#### Moat Contribution
- **Search pattern capture live** ✅
- Ingredient co-occurrence data flowing

---

### Week 4: Training Data Collection

#### Objectives
- Build manual labeling interface
- Collect 500+ labeled examples
- Prepare dataset for model improvement

#### Tasks

**Day 1-2: Labeling Interface**
- [ ] Build admin labeling tool
- [ ] Show video + extracted ingredients
- [ ] Allow corrections (add/remove/edit)
- [ ] Export labeled data (JSON/CSV)

**Day 3-5: Data Collection**
- [ ] Manually label 500 videos
- [ ] Focus on common ingredients
- [ ] Include edge cases (misspellings, synonyms)
- [ ] Validate label quality (spot checks)

**Day 6-7: Dataset Preparation**
- [ ] Split train/validation/test sets
- [ ] Document dataset statistics
- [ ] Create dataset export script

#### Deliverables
- [x] Labeled dataset (500+ examples)
- [x] Labeling tool functional
- [x] Dataset ready for training

**Note:** Model training happens separately (Python). V1 uses rule-based + Claude API extraction.

---

### Week 5: ML Models & Improvement

#### Objectives
- Improve extraction accuracy
- Build ingredient synonym/normalization
- Add tag detection (vegan, air fryer, etc.)

#### Tasks

**Day 1-3: Extraction Improvement**
- [ ] Fine-tune extraction prompt with Claude API (use labeled data)
- [ ] Add ingredient normalization (e.g., "tomatoes" → "tomato")
- [ ] Build synonym mapping
- [ ] Test improved accuracy

**Day 4-5: Tag Detection**
- [ ] Detect cooking method tags (air fryer, oven, stovetop)
- [ ] Detect dietary tags (vegan, vegetarian, gluten-free)
- [ ] Store tags in database
- [ ] Add tag filter to search

**Day 6-7: Quality Metrics**
- [ ] Build accuracy measurement script
- [ ] Test with validation set
- [ ] Document improvement (before/after)
- [ ] Set up monitoring (extraction success rate)

#### Deliverables
- [x] Extraction accuracy >70%
- [x] Tag detection working
- [x] Ingredient normalization in place

---

### Week 6: Demand Intelligence + Corrections ✅ COMPLETE

#### Objectives
- Build demand signals (High/Medium/Low)
- Implement ingredient correction system
- Start collecting training data from users

#### Tasks

**Day 1-3: Demand Signals** ✅
- [x] ~~Integrate Google Trends RSS feed~~ → Built YouTube market-based demand system instead (zero extra API calls)
- [x] Calculate demand bands (hot/growing/stable/niche/unknown)
- [x] Display demand on search results (DemandBadge component)
- [x] Market metrics: avg views, median views, views/day, video count
- [x] Content gap analysis: underserved/saturated/balanced/emerging
- [x] Content opportunities: quality_gap, freshness_gap, underserved, trending
- [x] Relevance filtering: Videos filtered by ingredient match (≥50%) to prevent misleading demand signals
- [x] Handle caching (search cache in place)

**Day 4-7: Correction System** ⭐ **MOAT FEATURE** ✅
- [x] Add correction buttons to ingredients ("This is wrong" / "This is right")
- [x] Build correction submission (tRPC corrections.submit mutation)
- [x] Store corrections (user_id, video_id, ingredient, action)
- [x] Show correction impact ("Your correction affects X videos")
- [x] Confidence adjustment (wrong: -0.1, right: +0.05)
- [x] Add missing ingredient feature (corrections.addIngredient)
- [x] User correction stats (corrections.getStats)
- [ ] Build correction analytics (admin) — deferred to V1.1
- [ ] Gamification: Badge system — deferred to V1.1

#### Deliverables
- [x] Demand signals visible
- [x] **Correction system live** ✅
- [x] User corrections collected

#### Moat Contribution
- **Correction data collection begins** ✅
- Training data from users flowing

---

### Week 7: Opportunities & Tracking ✅ COMPLETE

#### Objectives
- Build opportunity detection algorithm
- Implement opportunity tracking
- Build outcome reporting system

#### Tasks

**Day 1-3: Opportunity Detection** ✅
- [x] Build opportunity scoring (supply vs demand) - Integrated with Week 6 demand intelligence
- [x] Identify recipe variations (e.g., "vegan version") - Content gap analysis
- [x] Display opportunities with evidence - Shown in search results
- [x] Show opportunity accuracy (if enough outcomes)
  - Free users: Summary only ("73% of HIGH opportunities beat category average")
  - Pro users: Full detail (breakdown by opportunity type, sample sizes, historical trends)

**Day 4-5: Opportunity Tracking** ⭐ **MOAT FEATURE** ✅
- [x] Build "Track This Opportunity" feature
- [x] Create "My Opportunities" page
- [x] Add status tracking (Researching, Filming, Published)
- [x] Enforce free tier limits (5 active)

**Day 6-7: Outcome Reporting** ⭐ **MOAT FEATURE** ✅
- [x] Build outcome reporting form
- [ ] Set up scheduled email reminders (Resend) after 30 days - Deferred to Week 8
- [x] Store outcomes (video_url, views, rating)
- [x] Calculate opportunity accuracy scores
- [x] Show personal accuracy stats
  - Free users: Summary view (overall accuracy percentage)
  - Pro users: Detailed view (accuracy by opportunity type, sample sizes, comparison to community averages)

#### Deliverables
- [x] Opportunities detected and displayed
- [x] **Tracking system live** ✅
- [x] **Outcome reporting live** ✅

#### Moat Contribution
- **Outcome calibration loop begins** ✅
- Accuracy scores calculated (when N>100)

---

### Week 8: Auth + Payments

#### Objectives
- Implement user authentication
- Build subscription system
- Enforce free/pro tiers

#### Tasks

**Day 1-3: Authentication**
- [ ] Set up Supabase Auth
- [ ] Add email/password auth
- [ ] Add Google OAuth
- [ ] Build login/signup pages (frontend)
- [ ] Add protected routes (Hono middleware)
- [ ] Set up Resend for transactional emails (verification, password reset)

**Day 4-6: Subscription System**
- [ ] Integrate Stripe
- [ ] Build subscription plans (Free/Pro)
- [ ] Create checkout flow
- [ ] Build subscription management page
- [ ] Enforce feature limits (searches, tracking)

**Day 7: Usage Tracking**
- [ ] Track search usage per user
- [ ] Display usage limits (10/week for free)
- [ ] Build upgrade prompts
- [ ] Test subscription flow end-to-end

#### Deliverables
- [x] Users can sign up/login
- [x] Subscriptions working
- [x] Free/Pro tiers enforced

---

### Week 9: Trends + Polish + Launch

#### Objectives
- Build trends dashboard
- Polish UX/UI
- Soft launch to beta users

#### Tasks

**Day 1-2: Trends Dashboard (Basic)**
- [ ] Build trending ingredients calculation
- [ ] Show supply vs demand comparison (lists, no charts)
- [ ] Add "Trends" page
- [ ] Note: Community insights deferred to V1.1 (needs N=100+ outcomes)

**Day 3-4: Polish & Bug Fixes**
- [ ] Fix critical bugs
- [ ] Improve loading states
- [ ] Add error handling
- [ ] Optimize performance (lazy loading, caching)
- [ ] Mobile responsiveness

**Day 5-7: Launch Preparation**
- [ ] Set up production environment
- [ ] Configure monitoring:
  - [ ] Sentry SDK (frontend + backend)
  - [ ] Basic Grafana dashboards (user counts, API metrics)
  - [ ] Web Vitals tracking (frontend performance)
  - [ ] Error alerts (Sentry → email/Slack)
- [ ] Write launch announcement
- [ ] Recruit 50 beta users
- [ ] Create onboarding flow
- [ ] Launch! 🚀

#### Deliverables
- [x] Trends dashboard live
- [x] Production-ready app
- [x] 50 beta users onboarded

---

## 5. Technical Architecture

### 5.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Search  │  │ Tracking │  │ Trends   │  │ Profile  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                   API Layer (Hono + tRPC)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ tRPC     │  │ tRPC     │  │ tRPC     │  │ tRPC     │   │
│  │ search   │  │ track    │  │ outcomes │  │ auth     │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼────┐ ┌───────▼──────┐
│  PostgreSQL  │ │  Redis  │ │  External    │
│   (Prisma)   │ │ (BullMQ)│ │  APIs        │
│              │ │         │ │              │
│ • Users      │ │ • Jobs  │ │ • YouTube    │
│ • Videos     │ │ • Cache │ │ • Trends     │
│ • Ingredients│ │         │ │ • Stripe     │
│ • Searches   │ │         │ │ • Claude     │
│ • Corrections│ │         │ │   (Anthropic)│
│ • Outcomes   │ │         │ │              │
└──────────────┘ └─────────┘ └──────────────┘
```

### 5.2 Data Flow: Search

```
User Input (ingredients)
    ↓
tRPC: search.mutate()
    ↓
Query Database (videos with matching ingredients)
    ↓
Rank by Relevance
    ↓
Log Search Pattern
    ↓
Return Results
    ↓
Display (with demand signals, opportunities)
```

### 5.3 Data Flow: Correction

```
User clicks "This is wrong"
    ↓
tRPC: corrections.submit.mutate()
    ↓
Store Correction (user_id, video_id, ingredient, action)
    ↓
Update Ingredient Confidence
    ↓
Queue Model Retraining (weekly)
    ↓
Show Impact ("You've improved 12 results")
```

### 5.4 Data Flow: Outcome Tracking

```
User tracks opportunity
    ↓
Store in "tracked_opportunities"
    ↓
[30 days later]
    ↓
Send Reminder Email
    ↓
User reports outcome
    ↓
Store Outcome (video_url, views, rating)
    ↓
Recalculate Opportunity Accuracy
    ↓
Update Opportunity Scores
```

---

## 6. Data Models

### 6.1 Core Entities

#### Users
```typescript
{
  id: string
  email: string
  subscription: 'free' | 'pro'
  created_at: Date
  search_count_this_week: number
  corrections_count: number
}
```

#### Videos
```typescript
{
  id: string
  youtube_id: string
  title: string
  description: string
  thumbnail_url: string
  published_at: Date
  views: number
  extracted_at: Date
}
```

#### Ingredients
```typescript
{
  id: string
  name: string // normalized (e.g., "tomato")
  synonyms: string[] // ["tomatoes", "tomatoe"]
  confidence: number // 0-1 (for detection)
  source: 'title' | 'description' | 'transcript'
}
```

#### VideoIngredients (Join Table)
```typescript
{
  video_id: string
  ingredient_id: string
  confidence: number
  source: string
  corrections_count: number
}
```

#### Searches
```typescript
{
  id: string
  user_id: string
  ingredients: string[] // searched ingredients
  created_at: Date
  // MOAT: Search pattern tracking
}
```

#### Corrections ⭐ **MOAT DATA**
```typescript
{
  id: string
  user_id: string
  video_id: string
  ingredient_id: string
  action: 'wrong' | 'right' | 'add' | 'rename'
  suggested_name?: string
  created_at: Date
}
```

#### TrackedOpportunities ⭐ **MOAT DATA**
```typescript
{
  id: string
  user_id: string
  ingredients: string[]
  status: 'researching' | 'filming' | 'published' | 'abandoned'
  opportunity_score: 'high' | 'medium' | 'low'
  tracked_at: Date
}
```

#### Outcomes ⭐ **MOAT DATA**
```typescript
{
  id: string
  tracked_opportunity_id: string
  user_id: string
  video_url?: string
  views_7day?: number
  rating?: number // 1-5
  reported_at: Date
}
```

---

## 7. API Design

### 7.1 tRPC Router Structure

All procedures use tRPC for end-to-end type safety. Types are inferred from backend procedures and shared with frontend.

#### Router: `search`
```typescript
search: {
  mutate: z.object({
    ingredients: z.array(z.string()),
    tags: z.array(z.string()).optional(),
  }).input => {
    videos: Video[],
    demand: 'high' | 'medium' | 'low',
    opportunities: Opportunity[]
  }
}
```

#### Router: `corrections`
```typescript
corrections: {
  submit: z.object({
    video_id: z.string(),
    ingredient_id: z.string(),
    action: z.enum(['wrong', 'right', 'add', 'rename']),
  }).input => {
    success: boolean,
    impact_count: number
  }
}
```

#### Router: `opportunities`
```typescript
opportunities: {
  track: z.object({
    ingredients: z.array(z.string()),
    opportunity_score: z.enum(['high', 'medium', 'low']),
  }).input => { id: string },
  
  list: z.void().input => {
    active: TrackedOpportunity[],
    completed: TrackedOpportunity[]
  }
}
```

#### Router: `outcomes`
```typescript
outcomes: {
  submit: z.object({
    tracked_opportunity_id: z.string(),
    video_url: z.string().optional(),
    views: z.number().optional(),
    rating: z.number().min(1).max(5).optional(),
  }).input => { success: boolean }
}
```

#### Router: `trends`
```typescript
trends: {
  get: z.void().input => {
    trending_ingredients: TrendingIngredient[]
  }
}
```

---

### 7.2 Rate Limiting Strategy

Rate limiting is essential for:
- Enforcing free tier limits (10 searches/week)
- Preventing abuse
- Protecting external API quotas (YouTube, Claude)

#### Implementation (V1 - Database-Based)

**V1 Approach:** Database-based rate limiting (simple, sufficient for MVP)

**Tool:** Count queries in database (upgrade to Redis in V1.1 if needed)

**Rate Limits by Feature:**

| Feature | Free Tier | Pro Tier |
|---------|-----------|----------|
| **Searches** | 10/week | Unlimited |
| **Opportunity Tracking** | 5 active | Unlimited |
| **Corrections** | Unlimited | Unlimited |
| **Outcome Reporting** | Unlimited | Unlimited |

**Implementation Details (V1 - Database-Based):**

```typescript
// Example: Database-based rate limiting for tRPC procedures
const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  const userId = ctx.userId
  const subscription = ctx.user.subscription
  
  // Check search limit for free users (database count query)
  if (subscription === 'free') {
    const searchesThisWeek = await db.searches.count({
      where: {
        user_id: userId,
        created_at: {
          gte: startOfWeek(new Date())
        }
      }
    })
    
    if (searchesThisWeek >= 10) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Free tier limit: 10 searches/week. Upgrade to Pro for unlimited.'
      })
    }
  }
  
  return next()
})
```

**Note:** V1 uses database queries for rate limiting. Upgrade to Redis-based rate limiting in V1.1 if performance becomes an issue.

**External API Rate Limits:**

| Service | Limit | Handling Strategy |
|---------|-------|-------------------|
| **YouTube API** | 10,000 units/day | Cache results, batch requests, monitor quota |
| **Claude API** | Varies by tier | Exponential backoff, retry with delay, error handling |
| **Google Trends RSS** | No official limit | Cache results (1 hour TTL), respectful scraping |

**Implementation:** Add rate limiting to Week 3 (search) and Week 8 (auth system)

---

### 7.3 Caching Strategy

Caching improves performance and reduces external API costs.

#### What to Cache

| Data Type | Cache Layer | TTL | Invalidation |
|-----------|-------------|-----|--------------|
| **Search Results** | Redis | 5 minutes | When corrections submitted |
| **Video Metadata** | Redis | 24 hours | On video update |
| **Ingredient Extraction** | Database | Permanent | When correction submitted |
| **Demand Signals** | Redis | 1 hour | Daily refresh |
| **Trends** | Redis | 6 hours | Daily refresh |

#### Implementation

**Redis Caching (Upstash):**

```typescript
// Example: Cache search results
async function getCachedSearch(ingredients: string[]) {
  const cacheKey = `search:${ingredients.sort().join(',')}`
  const cached = await redis.get(cacheKey)
  
  if (cached) return JSON.parse(cached)
  
  const results = await performSearch(ingredients)
  await redis.setex(cacheKey, 300, JSON.stringify(results)) // 5 min TTL
  
  return results
}
```

**Cache Invalidation:**
- When user submits correction → Invalidate related search caches
- When new video ingested → Invalidate trend caches
- Daily cron job → Refresh demand signals and trends

**Implementation:** Add caching to Week 3 (search) and Week 6 (demand signals)

---

### 7.4 Database Indexes

Indexes are critical for search performance. Add these indexes to the schema:

#### Required Indexes

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| **idx_videos_title_fts** | videos | title (full-text) | Search by video title |
| **idx_video_ingredients** | video_ingredients | (ingredient_id, video_id) | Join ingredient-video lookups |
| **idx_searches_user_date** | searches | (user_id, created_at) | User search history, weekly counts |
| **idx_corrections_video** | corrections | (video_id, ingredient_id) | Correction lookups |
| **idx_opportunities_user** | tracked_opportunities | (user_id, status) | User opportunity list |
| **idx_outcomes_opportunity** | outcomes | tracked_opportunity_id | Outcome lookups |

#### Index Implementation

```sql
-- Full-text search index on video titles
CREATE INDEX idx_videos_title_fts ON videos USING gin(to_tsvector('english', title));

-- Composite index for ingredient-video joins
CREATE INDEX idx_video_ingredients ON video_ingredients(ingredient_id, video_id);

-- Index for user search tracking
CREATE INDEX idx_searches_user_date ON searches(user_id, created_at DESC);

-- Index for corrections
CREATE INDEX idx_corrections_video ON corrections(video_id, ingredient_id);

-- Index for tracked opportunities
CREATE INDEX idx_opportunities_user ON tracked_opportunities(user_id, status);

-- Index for outcomes
CREATE INDEX idx_outcomes_opportunity ON outcomes(tracked_opportunity_id);
```

**Implementation:** Add indexes in Prisma schema during Week 1 (database schema)

---

### 7.5 Environment Variables

Complete list of environment variables needed for development and production.

#### Frontend Environment Variables

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.kitvas.com` | Yes |
| `NEXT_PUBLIC_ENVIRONMENT` | Environment | `production` / `development` | Yes |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry frontend DSN | `https://...@sentry.io/...` | Yes |

#### Backend Environment Variables

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` | Yes |
| `REDIS_URL` | Redis connection string | `redis://...` | Yes |
| `ANTHROPIC_API_KEY` | Claude API key | `sk-ant-...` | Yes |
| `YOUTUBE_API_KEY` | YouTube Data API key | `AIza...` | Yes |
| `STRIPE_SECRET_KEY` | Stripe API key | `sk_live_...` | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` | Yes |
| `RESEND_API_KEY` | Resend email API key | `re_...` | Yes |
| `SUPABASE_URL` | Supabase project URL | `https://...supabase.co` | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service key | `eyJ...` | Yes |
| `SENTRY_DSN` | Sentry backend DSN | `https://...@sentry.io/...` | Yes |
| `ENVIRONMENT` | Environment | `production` / `development` | Yes |

#### Management

**Development:**
- Use `.env.local` (frontend) and `.env` (backend)
- Add `.env.local` and `.env` to `.gitignore`

**Production:**
- Store in Railway environment variables (frontend + backend)
- Store in GitHub Secrets (for CI/CD)
- Never commit secrets to repository

**Security:**
- Rotate keys periodically
- Use separate keys for development/production
- Monitor API key usage

**Implementation:** Document in Week 1 (project setup)

---

### 7.6 Cost Estimates

Estimated monthly costs for running Kitvas V1 (assuming moderate usage).

#### Infrastructure Costs

| Service | Tier | Monthly Cost | Notes |
|---------|------|--------------|-------|
| **Railway** (single service, monorepo) | Starter | $5-20 | Pay-per-use, deploy frontend+backend together |
| **Supabase** | Free → Pro | $0 → $25 | Free tier: 500MB DB, Pro after |
| **Upstash Redis** | Free → Pay | $0 → $10-30 | Free tier: 10K commands/day (for queue only) |
| **Claude API** | Pay-per-use | $30-100 | Aggressive caching reduces costs |
| **YouTube API** | Free | $0 | Free quota: 10K units/day |
| **Resend** | Free → Pay | $0 → $20 | Free tier: 3K emails/month |
| **Sentry** | Free | $0 | Free tier: 5K errors/month (sufficient for launch) |
| **Stripe** | Pay-per-transaction | ~$0.50/transaction | 2.9% + $0.30 per transaction |

**Note:** Grafana Cloud deferred to V1.1 (Month 2-3) when you have enough data.

#### Estimated Total Costs (Optimized)

| Stage | Infrastructure | External APIs | Total/Month | Savings vs Original |
|-------|---------------|---------------|-------------|---------------------|
| **Launch (50 users)** | $5-20 | $30-100 | **$35-120** | **$35-70/month** |
| **Month 1-3 (500 users)** | $10-30 | $50-150 | **$60-180** | **$80-100/month** |
| **Month 6+ (2000 users)** | $20-50 | $100-200 | **$120-250** | **$110-200/month** |

**Cost Optimization (V1):**
- Single Railway service (monorepo) vs separate services
- Sentry free tier only (Grafana deferred)
- Database-based rate limiting (Redis only for queue)
- Aggressive caching reduces Claude API costs
- All services on free tiers where possible

**Budget Planning (Optimized):**
- **Launch Budget:** $100/month (vs $150 original)
- **Growth Budget (Month 3):** $180/month (vs $300 original)
- **Scale Budget (Month 6):** $250/month (vs $500 original)

**Implementation:** Monitor costs in Grafana dashboards, set up budget alerts

---

## 8. Testing Strategy

A comprehensive testing strategy ensures reliability and catches issues early. Testing should be integrated into development from day one.

### 8.1 Frontend Testing (Next.js)

#### Unit Tests

| Tool | Purpose | What to Test |
|------|---------|--------------|
| **Vitest** or **Jest** | Component logic, utilities | Search input parsing, ingredient normalization, form validation |
| **React Testing Library** | React components | Component rendering, user interactions, hooks |
| **@testing-library/jest-dom** | DOM assertions | Element visibility, disabled states, text content |

**Key Areas:**
- **Search Components**: Ingredient input parsing, tag filtering, result display
- **Forms**: React Hook Form validation (Zod schemas), error states
- **State Management**: Zustand store updates, context providers
- **Utilities**: Ingredient normalization, date formatting, data transformations

**Example Test Structure:**
```typescript
// components/SearchInput.test.tsx
describe('SearchInput', () => {
  it('parses ingredient input correctly', () => {})
  it('validates ingredient count (max 10)', () => {})
  it('filters out empty ingredients', () => {})
})
```

#### Component Tests

| Component | Test Focus |
|-----------|-----------|
| **Search Interface** | Input handling, ingredient chips, filter interactions |
| **Video Results** | Card rendering, ingredient display, correction buttons |
| **Opportunity Cards** | Track button, status updates, outcome reporting |
| **Forms** | Validation, submission, error handling |
| **Subscription** | Upgrade flow, tier limits, feature gating |

**Coverage Goal (V1):** 50%+ for critical components only (focus on business logic, ship faster)

#### Integration Tests

| Tool | Purpose | What to Test |
|------|---------|--------------|
| **Vitest + React Testing Library** | Component interactions | Search → Results flow, Tracking → Outcome flow |
| **MSW (Mock Service Worker)** | API mocking | tRPC procedure responses, error scenarios |

**Key Flows:**
- Search by ingredients → Display results → View opportunities
- Track opportunity → Update status → Report outcome
- Submit correction → Show impact feedback
- Auth flow (login → protected routes)

#### E2E Tests

| Tool | Purpose | Coverage |
|------|---------|----------|
| **Playwright** | Full user flows | Critical paths, subscription flow, better CI/CD integration |

**Critical E2E Tests:**
1. **Search Flow**
   - User enters ingredients → Sees results → Views opportunities → Tracks one
2. **Correction Flow**
   - User sees incorrect ingredient → Clicks "This is wrong" → Submits correction → Sees impact
3. **Outcome Reporting**
   - User tracks opportunity → 30 days later → Receives reminder → Reports outcome
4. **Subscription Flow**
   - Free user hits limit → Sees upgrade prompt → Completes Stripe checkout → Features unlock

**E2E Coverage Goal (V1):** 2-3 critical user flows only (search flow, tracking flow, subscription flow)

### 8.2 Backend Testing (Hono + tRPC)

#### Unit Tests

| Tool | Purpose | What to Test |
|------|---------|--------------|
| **Vitest** | Business logic | Search ranking, opportunity scoring, data transformations |
| **Mock** | External dependencies | YouTube API, Claude API, Supabase client |

**Key Areas:**
- **Search Logic**: Ranking algorithm, relevance scoring, ingredient matching
- **Opportunity Detection**: Supply vs demand calculation, score computation
- **Data Transformations**: Video metadata parsing, ingredient normalization
- **Business Rules**: Free tier limits, subscription validation

**Example Test Structure:**
```typescript
// server/routers/search.test.ts
describe('search ranking', () => {
  it('ranks exact matches higher than partial', () => {})
  it('boosts videos with multiple matching ingredients', () => {})
})
```

#### tRPC Procedure Tests

| Tool | Purpose | What to Test |
|------|---------|--------------|
| **Vitest + tRPC Test Client** | tRPC procedures | Input validation, business logic, error handling |

**Test Coverage:**
- **Search Router**: `search.mutate()` - ingredient matching, result ranking
- **Corrections Router**: `corrections.submit.mutate()` - correction storage, impact calculation
- **Opportunities Router**: `opportunities.track.mutate()`, `opportunities.list.query()`
- **Outcomes Router**: `outcomes.submit.mutate()` - outcome storage, accuracy updates
- **Trends Router**: `trends.get.query()` - trending calculation

**Example:**
```typescript
// server/routers/search.test.ts
import { createCaller } from '../root'

describe('tRPC search router', () => {
  it('validates ingredient input', async () => {
    const caller = createCaller({ db, userId: 'test' })
    await expect(caller.search.mutate({ ingredients: [] })).rejects.toThrow()
  })
  
  it('returns ranked results', async () => {})
  it('logs search pattern', async () => {})
})
```

#### Integration Tests

| Tool | Purpose | What to Test |
|------|---------|--------------|
| **Vitest + Test Database** | Full stack integration | Database queries, Prisma operations, external APIs |

**Test Database Setup:**
- Use separate test database (PostgreSQL)
- Reset database before each test suite
- Seed test data for consistent tests

**Key Integration Tests:**
- **Database Operations**: CRUD operations, transactions, relationships
- **External APIs**: YouTube API (mocked), Claude API (mocked), Stripe (test mode)
- **Queue Jobs**: BullMQ job processing, retry logic
- **Authentication**: Supabase Auth integration, protected routes

**Example:**
```typescript
// server/integration/search.test.ts
describe('Search integration', () => {
  beforeEach(async () => {
    await resetTestDatabase()
    await seedTestVideos()
  })
  
  it('searches database and returns results', async () => {})
  it('tracks search in database', async () => {})
})
```

#### API/Contract Tests

| Focus | What to Test |
|-------|--------------|
| **Request Validation** | Zod schema validation, type coercion |
| **Response Format** | tRPC response structure, error format |
| **Error Handling** | 400/401/500 errors, error messages |

**Coverage Goal (V1):** 50%+ for business logic, 70%+ for critical procedures (focus on shipping, add more tests in V1.1)

### 8.3 Data Layer Testing

#### Database Query Tests

| Tool | Purpose | What to Test |
|------|---------|--------------|
| **Vitest + Test DB** | Query correctness | SELECT queries, JOINs, aggregations, indexes |
| **Prisma Studio** (manual) | Query inspection | Complex queries, performance |

**Key Queries to Test:**
- **Search Queries**: Ingredient matching, relevance ranking, pagination
- **Aggregations**: Opportunity scores, trend calculations, user stats
- **Joins**: Video-Ingredient relationships, user-corrections, opportunity-outcomes
- **Indexes**: Query performance, slow query detection

**Example:**
```typescript
// server/db/queries.test.ts
describe('Search queries', () => {
  it('finds videos by ingredients', async () => {
    const results = await searchVideosByIngredients(['miso', 'pasta'])
    expect(results).toHaveLength(5)
  })
  
  it('uses indexes for performance', async () => {
    // Check query execution plan
  })
})
```

#### Data Pipeline Tests

| Tool | Purpose | What to Test |
|------|---------|--------------|
| **Vitest + Mock Queue** | Job processing | Video ingestion, ingredient extraction, data transformation |

**Key Pipeline Tests:**
- **YouTube Ingestion**: Video fetching, metadata extraction, database storage
- **Ingredient Extraction**: Claude API calls, result parsing, confidence scoring
- **Queue Processing**: Job enqueuing, retry logic, error handling
- **Data Transformations**: Normalization, validation, deduplication

**Example:**
```typescript
// server/jobs/extraction.test.ts
describe('Ingredient extraction job', () => {
  it('extracts ingredients from video metadata', async () => {
    const result = await processExtractionJob(mockVideoData)
    expect(result.ingredients).toContain('miso')
  })
  
  it('handles extraction errors gracefully', async () => {})
  it('retries failed jobs', async () => {})
})
```

#### Data Integrity Tests

| Focus | What to Test |
|-------|--------------|
| **Constraints** | Foreign keys, unique constraints, NOT NULL |
| **Relationships** | Cascade deletes, referential integrity |
| **Validations** | Data types, enum values, check constraints |

**Tests:**
- Database migrations (schema changes don't break data)
- Foreign key constraints (orphaned records prevented)
- Data consistency (normalized ingredients, consistent user_id references)

#### ML Model Tests

| Focus | What to Test |
|-------|--------------|
| **Extraction Accuracy** | Precision, recall, F1 score |
| **Model Performance** | Latency, token usage, cost |

**Testing Approach:**
- **Labeled Test Set**: 100+ manually labeled videos (ground truth)
- **Accuracy Metrics**: Compare Claude API output to ground truth
- **Regression Tests**: Ensure accuracy doesn't degrade over time
- **Edge Cases**: Misspellings, synonyms, ambiguous ingredients

**Example:**
```typescript
// server/ml/extraction.test.ts
describe('Ingredient extraction model', () => {
  it('achieves >70% accuracy on test set', async () => {
    const accuracy = await evaluateExtractionModel(testVideos)
    expect(accuracy).toBeGreaterThan(0.7)
  })
  
  it('handles misspellings correctly', async () => {})
})
```

### 8.4 Test Tools & Setup

#### Frontend Testing Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Test runner (faster than Jest, Vite-native) |
| **React Testing Library** | Component testing |
| **MSW (Mock Service Worker)** | API mocking for integration tests |
| **Playwright** | E2E testing |
| **@testing-library/user-event** | User interaction simulation |

#### Backend Testing Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Test runner |
| **tRPC Test Client** | tRPC procedure testing |
| **Prisma Test Client** | Database testing |
| **MSW** | External API mocking (YouTube, Claude) |
| **supertest** (optional) | HTTP endpoint testing |

#### Test Database Setup

| Approach | Description |
|----------|-------------|
| **Test Database** | Separate PostgreSQL database for tests |
| **Docker Compose** | Local test database in CI/CD |
| **Database Reset** | Truncate tables before each test suite |
| **Seed Data** | Consistent test data for integration tests |

### 8.5 Test Coverage Goals (V1 - Budget-Conscious)

| Layer | Coverage Target (V1) | V1.1+ Goal | Priority |
|-------|---------------------|------------|----------|
| **Frontend Utilities** | 50%+ (critical only) | 80%+ | High |
| **Frontend Components** | 50%+ (critical only) | 70%+ | Medium |
| **Backend Business Logic** | 50%+ (critical paths) | 85%+ | High |
| **tRPC Procedures** | 50%+ (critical only) | 80%+ | High |
| **Database Queries** | 50%+ (critical queries) | 70%+ | Medium |
| **Data Pipeline** | 50%+ (critical jobs) | 75%+ | High |
| **E2E Flows** | 2-3 critical paths | 5-10 flows | Medium |

**V1 Strategy:** Focus on critical paths and business logic. Test enough to ship with confidence, add comprehensive tests in V1.1.

**V1.1+ Strategy:** Increase coverage to enterprise levels once product is validated.

### 8.6 Testing Workflow

#### During Development
- Write unit tests alongside code (TDD for critical logic)
- Run tests before committing (pre-commit hooks)
- Integration tests for new features

#### CI/CD Pipeline
- See [CI/CD Pipelines](#9-ci/cd-pipelines) section for detailed GitHub Actions workflows

#### Before Launch
- Full test suite passes
- Manual testing checklist completed
- Smoke tests on staging environment

### 8.7 Manual Testing Checklist

**Before Launch:**

**Frontend:**
- [ ] Search works with 1-10 ingredients
- [ ] Ingredient chips add/remove correctly
- [ ] Results display with correct data
- [ ] Corrections submit and show impact
- [ ] Opportunity tracking saves correctly
- [ ] Outcome reporting works end-to-end
- [ ] Free tier limits enforced (searches, tracking)
- [ ] Pro subscription activates features
- [ ] Mobile responsive (iPhone, Android, tablet)
- [ ] Loading states display correctly
- [ ] Error messages are user-friendly

**Backend:**
- [ ] tRPC procedures handle invalid input
- [ ] Authentication protects routes
- [ ] Database constraints prevent bad data
- [ ] Queue jobs process successfully
- [ ] External API failures handled gracefully
- [ ] Rate limiting works (if implemented)

**Data Layer:**
- [ ] Database queries perform well (<100ms for common queries)
- [ ] Ingredient extraction accuracy acceptable (>70%)
- [ ] Data pipeline processes videos correctly
- [ ] No data loss during migrations

---

## 9. Deployment Plan

### 9.1 Environment Setup

#### Development
- Local PostgreSQL (Docker)
- Local Redis (Docker)
- Environment variables (.env.local)

#### Production
- Railway (frontend + backend API as separate services)
- Supabase (database)
- Upstash (Redis, or Railway Redis add-on)
- Stripe (payments)

### 9.2 CI/CD Pipelines

All CI/CD pipelines use GitHub Actions within the GitHub ecosystem. This ensures seamless integration with code repositories, pull requests, and deployment workflows.

#### Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Frontend   │  │   Backend    │  │   Shared     │     │
│  │   (Next.js)  │  │   (Hono)     │  │   Configs    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                          │                                  │
│                  GitHub Actions Workflows                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   FE CI/CD   │  │   BE CI/CD   │  │   Data CI/CD │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         ▼                  ▼                  ▼             │
│      Railway            Railway          Supabase          │
└─────────────────────────────────────────────────────────────┘
```

#### Frontend CI/CD Pipeline (Next.js)

**Workflow File:** `.github/workflows/frontend-ci.yml`

**Triggers:**
- On push to `main` branch
- On pull request to `main`
- On push to `develop` branch
- Manual workflow dispatch

**Pipeline Stages:**

1. **Lint & Type Check**
   ```yaml
   - name: Lint
     run: npm run lint
   
   - name: Type Check
     run: npm run type-check
   ```

2. **Unit & Component Tests**
   ```yaml
   - name: Run Tests
     run: npm run test
   
   - name: Test Coverage
     run: npm run test:coverage
   ```

3. **Build**
   ```yaml
   - name: Build
     run: npm run build
     env:
       NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
   ```

4. **E2E Tests** (on main branch only)
   ```yaml
   - name: Playwright E2E Tests
     run: npm run test:e2e
   ```

5. **Deploy to Railway** (on main branch only)
   ```yaml
   - name: Deploy to Railway
     uses: bervProject/railway-deploy@v0.1.1
     with:
       railway_token: ${{ secrets.RAILWAY_TOKEN }}
       service: frontend
   ```

**Environment Variables (GitHub Secrets):**
- `RAILWAY_TOKEN` - Railway API token
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `SENTRY_DSN` - Sentry frontend DSN
- `NEXT_PUBLIC_ENVIRONMENT` - Production/staging

**Failure Conditions:**
- Lint errors
- Type errors
- Test failures
- Coverage below 50% (V1 minimum for critical paths)
- Build failures

#### Backend CI/CD Pipeline (Hono + tRPC)

**Workflow File:** `.github/workflows/backend-ci.yml`

**Triggers:**
- On push to `main` branch
- On pull request to `main`
- On push to `develop` branch
- Manual workflow dispatch

**Pipeline Stages:**

1. **Lint & Type Check**
   ```yaml
   - name: Lint
     run: npm run lint
   
   - name: Type Check
     run: npm run type-check
   ```

2. **Unit Tests**
   ```yaml
   - name: Run Unit Tests
     run: npm run test:unit
   ```

3. **Integration Tests** (with test database)
   ```yaml
   - name: Start Test Database
     run: docker-compose up -d postgres redis
   
   - name: Run Integration Tests
     run: npm run test:integration
     env:
       DATABASE_URL: postgresql://test:test@localhost:5432/test
       REDIS_URL: redis://localhost:6379
   ```

4. **tRPC Procedure Tests**
   ```yaml
   - name: Run tRPC Tests
     run: npm run test:trpc
   ```

5. **Build**
   ```yaml
   - name: Build
     run: npm run build
   ```

6. **Deploy to Railway** (on main branch only)
   ```yaml
   - name: Deploy to Railway
     uses: bervProject/railway-deploy@v0.1.1
     with:
       railway_token: ${{ secrets.RAILWAY_TOKEN }}
       service: backend
   ```

7. **Run Database Migrations** (on main branch only)
   ```yaml
   - name: Run Prisma Migrations
     run: npx prisma migrate deploy
     env:
       DATABASE_URL: ${{ secrets.DATABASE_URL }}
   ```

**Environment Variables (GitHub Secrets):**
- `RAILWAY_TOKEN` - Railway API token
- `DATABASE_URL` - Production database URL
- `REDIS_URL` - Production Redis URL
- `ANTHROPIC_API_KEY` - Claude API key
- `YOUTUBE_API_KEY` - YouTube Data API key
- `SENTRY_DSN` - Sentry backend DSN
- `STRIPE_SECRET_KEY` - Stripe API key

**Failure Conditions:**
- Lint errors
- Type errors
- Test failures (unit, integration, tRPC)
- Coverage below 50% (business logic, V1 minimum)
- Build failures
- Migration failures

#### Data Pipeline CI/CD

**Workflow File:** `.github/workflows/data-pipeline-ci.yml`

**Purpose:** Tests and validates data pipeline components (extraction, ingestion, ML models)

**Triggers:**
- On push to `main` branch (data pipeline changes)
- On pull request (data pipeline changes)
- Scheduled runs (weekly model validation)
- Manual workflow dispatch

**Pipeline Stages:**

1. **Data Pipeline Unit Tests**
   ```yaml
   - name: Test Extraction Logic
     run: npm run test:extraction
   
   - name: Test Queue Processing
     run: npm run test:queue
   ```

2. **ML Model Tests** (Python scripts)
   ```yaml
   - name: Test ML Models
     run: |
       cd scripts/ml
       python -m pytest tests/
   ```

3. **Data Integrity Tests**
   ```yaml
   - name: Test Database Queries
     run: npm run test:db-queries
   ```

4. **Model Accuracy Validation** (scheduled runs)
   ```yaml
   - name: Validate Model Accuracy
     run: |
       cd scripts/ml
       python validate_model_accuracy.py
     env:
       MIN_ACCURACY: 0.70
   ```

**Environment Variables (GitHub Secrets):**
- `ANTHROPIC_API_KEY` - Claude API key (test mode)
- `DATABASE_URL` - Test database URL

#### Shared Workflows

**Workflow File:** `.github/workflows/shared-tests.yml`

**Purpose:** Tests shared code, utilities, and type definitions

**Stages:**
- Lint shared code
- Type check shared packages
- Test shared utilities

#### Pre-commit Hooks (GitHub Actions)

**Workflow File:** `.github/workflows/pre-commit.yml`

**Purpose:** Runs lightweight checks before PR merge

**Triggers:**
- On pull request

**Checks:**
- Code formatting (Prettier)
- Lint checks
- Type checking
- Small unit tests

#### Branch Protection Rules

Configure in GitHub repository settings:

**Main Branch:**
- Require pull request reviews (1 reviewer)
- Require status checks to pass:
  - Frontend CI
  - Backend CI
  - Data Pipeline CI (if changed)
- Require branches to be up to date
- Require conversation resolution before merging
- Do not allow force pushes

**Develop Branch:**
- Require pull request reviews (optional)
- Require status checks to pass (lighter set)

#### Deployment Environments

| Environment | Trigger | Purpose |
|-------------|---------|---------|
| **Development** | Push to `develop` | Feature testing, integration |
| **Staging** | Push to `staging` | Pre-production testing |
| **Production** | Push to `main` | Live application |

#### GitHub Actions Secrets

Manage in: **Repository Settings → Secrets and variables → Actions**

**Required Secrets:**

**Frontend:**
- `RAILWAY_TOKEN`
- `NEXT_PUBLIC_API_URL`
- `SENTRY_DSN`

**Backend:**
- `RAILWAY_TOKEN`
- `DATABASE_URL`
- `REDIS_URL`
- `ANTHROPIC_API_KEY`
- `YOUTUBE_API_KEY`
- `GOOGLE_TRENDS_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SENTRY_DSN`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

**Shared:**
- `ENVIRONMENT` (production/staging/development)

#### Workflow Examples

**Example: Frontend PR Workflow**
```yaml
name: Frontend CI

on:
  pull_request:
    branches: [main, develop]
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-ci.yml'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend
      
      - name: Lint
        run: npm run lint
        working-directory: ./frontend
      
      - name: Type check
        run: npm run type-check
        working-directory: ./frontend
      
      - name: Run tests
        run: npm run test
        working-directory: ./frontend
      
      - name: Test coverage
        run: npm run test:coverage
        working-directory: ./frontend
      
      - name: Build
        run: npm run build
        working-directory: ./frontend
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}

  deploy:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@v0.1.1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: frontend
```

**Example: Backend Deployment Workflow**
```yaml
name: Backend CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/backend-ci.yml'

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend
      
      - name: Lint
        run: npm run lint
        working-directory: ./backend
      
      - name: Type check
        run: npm run type-check
        working-directory: ./backend
      
      - name: Run unit tests
        run: npm run test:unit
        working-directory: ./backend
      
      - name: Run integration tests
        run: npm run test:integration
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      
      - name: Build
        run: npm run build
        working-directory: ./backend

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@v0.1.1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend
      
      - name: Run database migrations
        run: npx prisma migrate deploy
        working-directory: ./backend
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

#### CI/CD Best Practices

1. **Fast Feedback**: Run quick tests first (lint, type check) before expensive tests
2. **Parallel Jobs**: Run frontend and backend tests in parallel
3. **Caching**: Cache node_modules, Docker images, build artifacts
4. **Failure Notifications**: Integrate with Slack/email for failed builds
5. **Rollback Strategy**: Keep previous deployment artifacts for quick rollback
6. **Environment Parity**: Ensure test environment matches production (PostgreSQL, Redis versions)

#### Pipeline Status Badges

Add to README.md:
```markdown
![Frontend CI](https://github.com/username/kitvas/workflows/Frontend%20CI/badge.svg)
![Backend CI](https://github.com/username/kitvas/workflows/Backend%20CI/badge.svg)
```

### 9.3 Deployment Process

1. **Pre-deployment**
   - Run migrations
   - Set environment variables
   - Test in staging (optional)

2. **Deployment**
   - Push to main branch
   - GitHub Actions triggers CI/CD pipeline
   - Railway auto-deploys (via GitHub Actions or Railway GitHub integration)
   - Run database migrations (Prisma) via CI/CD

3. **Post-deployment**
   - Verify critical features
   - Monitor error logs (Sentry)
   - Check analytics (Grafana)

### 9.4 Monitoring

A comprehensive monitoring strategy is essential from day one to catch issues early and understand system behavior.

#### Frontend Monitoring

| Tool/Area | Technology | What It Monitors |
|-----------|-----------|------------------|
| **Error Tracking** | Sentry (free tier) | JavaScript errors, React errors, unhandled promises |
| **Performance** | Web Vitals (via Sentry) | Core Web Vitals (LCP, FID, CLS), page load times |
| **Real User Monitoring** | Sentry Replays | User sessions, errors in context |
| **API Calls** | tRPC Middleware + Sentry | Request latency, success/failure rates |
| **User Analytics** | Database queries (basic) | Feature usage tracking (Grafana deferred to V1.1) |

**Implementation (V1):**
- Sentry SDK in Next.js for error tracking and session replay
- Web Vitals library to report to Sentry
- Basic analytics via database queries
- **Note:** Grafana dashboards deferred to V1.1 when you have enough data

#### Backend Monitoring

| Tool/Area | Technology | What It Monitors |
|-----------|-----------|------------------|
| **Error Tracking** | Sentry (free tier) | API errors, unhandled exceptions, stack traces |
| **APM** | Sentry Performance (V1.1+) | Request latency (P50, P95, P99), endpoint performance |
| **Logging** | Structured Logs (files) | Request/response logs, application events (Loki deferred) |
| **Metrics** | Railway metrics (built-in) | Request rates, error rates (Grafana deferred to V1.1) |
| **Tracing** | Sentry (basic) | Basic error tracking (distributed tracing in V1.1+) |

**Implementation (V1):**
- Sentry SDK in Hono backend (error tracking only)
- Structured JSON logging to files
- Basic metrics via Railway dashboard (built-in, free)
- **Note:** Grafana and advanced monitoring deferred to V1.1

#### Data Layer Monitoring

| Tool/Area | Technology | What It Monitors |
|-----------|-----------|------------------|
| **Database** | Supabase Dashboard | Query performance, slow queries, connection pool, DB size (built-in, free) |
| **Redis** | Upstash Dashboard | Memory usage, operations/sec, cache hit rates (built-in, free) |
| **Data Pipeline** | Database + Logs (basic) | Video ingestion rate, extraction job success/failure (Grafana deferred) |
| **ML Models** | Database + Logs (basic) | Extraction accuracy tracking (Grafana deferred to V1.1) |

**Implementation (V1):**
- Supabase monitoring built-in (free dashboard)
- Redis metrics from Upstash dashboard (free)
- Basic pipeline metrics via database queries
- **Note:** Grafana dashboards deferred to V1.1 when you have enough data

#### Business Metrics (V1 - Basic Tracking)

| Metric Category | V1 Tracking Method | Key Metrics |
|----------------|-------------------|-------------|
| **User Activity** | Database queries | Daily/Weekly active users, searches per user, corrections per user |
| **Feature Usage** | Database queries | Opportunities tracked, outcomes reported |
| **Moat Metrics** | Database queries | Correction rate, outcome reporting rate, data quality scores |
| **Revenue** | Stripe Dashboard + DB | Subscriptions, MRR, churn rate, conversion rate (free → pro) |

**V1:** Basic tracking via database queries and built-in dashboards (Supabase, Stripe, Railway)  
**V1.1+:** Add Grafana dashboards for better visualization and analysis

#### Monitoring Stack Summary

**Core Tools:**
- **Sentry**: Frontend + Backend error tracking, performance monitoring, session replay
- **Grafana**: Analytics, dashboards, business metrics, infrastructure monitoring
- **Prometheus**: Metrics collection (optional, can use Grafana's built-in data sources)
- **Grafana Loki**: Log aggregation (optional, can start with structured logs to files)

**Data Sources for Grafana:**
- Application metrics (Prometheus or custom exporters)
- Supabase PostgreSQL metrics
- Redis metrics (Upstash/Railway)
- Sentry data (via Sentry API integration)
- Custom business metrics (from application database)

#### Phase 1 (Launch): Essential Monitoring (V1 - Budget-Conscious)
- Sentry error tracking (FE + BE) - free tier only
- Web Vitals tracking (frontend performance) - via Sentry
- Basic metrics via Railway dashboard (built-in, free)

**Note:** Grafana deferred to V1.1 when you have enough data to make dashboards useful.

#### Phase 2 (Month 1-2): Enhanced Monitoring (V1.1)
- Add Grafana Cloud (free tier initially)
- Full Grafana dashboards (business metrics, moat metrics)
- Sentry Performance monitoring (if needed)
- Database query monitoring

#### Phase 3 (Month 3+): Advanced Monitoring
- Distributed tracing
- Log aggregation (Loki)
- ML model monitoring dashboards
- Prometheus metrics collection (if needed)

---

## 10. Risk Mitigation

### 10.1 Technical Risks

| Risk | Mitigation |
|------|------------|
| YouTube API rate limits | Cache results, batch requests |
| Extraction accuracy low | Start with rule-based, improve incrementally |
| Database performance | Index properly, paginate results |
| Stripe integration issues | Use Stripe test mode, follow docs |

### 10.2 Scope Risks

| Risk | Mitigation |
|------|------------|
| Features take too long | Defer to V1.1 (benchmarking, badges) |
| ML models delay launch | Use Claude API initially, train later |
| Perfectionism | Ship MVP, iterate based on feedback |

---

## 11. V1 Success Criteria

### 11.1 Week-by-Week Deliverables

| Week | Deliverable | Success Criteria |
|------|-------------|------------------|
| **Week 3** | Working search | Users can search by ingredients, see results |
| **Week 5** | ML extraction | Ingredient detection accuracy >70% |
| **Week 7** | Full feature set | All V1 features functional |
| **Week 9** | Production launch | 50 beta users onboarded |

### 11.2 Launch Checklist

#### Week 3 (Search)
- [x] Users can search by ingredients
- [x] Results ranked correctly
- [x] Search patterns logged

#### Week 6 (Corrections)
- [x] Users can submit corrections
- [x] Corrections stored in database
- [x] Impact visible to users

#### Week 7 (Tracking)
- [x] Users can track opportunities
- [x] Users can report outcomes
- [x] Outcome data collected

#### Week 9 (Launch)
- [x] All V1 features functional
- [x] 50 beta users signed up
- [x] No critical bugs
- [x] Monitoring in place (Sentry free tier)

---

## 12. V1 Notes & Considerations

### 12.1 MVP Philosophy

**Ship value, iterate on moats.** The moat features (corrections, outcomes) must be in V1, but they can start simple and improve.

### 12.2 Data Collection Priority

1. **Search patterns** (Week 3) - Automatic, no user action needed
2. **Corrections** (Week 6) - Low friction, immediate value
3. **Outcomes** (Week 7) - Higher friction, but core to moat

### 12.3 Technical Debt (Acceptable for V1)

Some shortcuts acceptable for V1:
- Claude API for extraction (vs. custom model)
- Simple relevance ranking (vs. ML ranking)
- Manual trends calculation (vs. real-time)
- Database-based rate limiting (vs. Redis)
- Sentry free tier only (vs. full monitoring stack)

**Plan:** Improve in V1.1+ as data accumulates and revenue grows.

### 12.4 V1 Scope Summary

**Included in V1:**
- ✅ Intelligent Recipe Search
- ✅ Ingredient Correction System
- ✅ Demand Intelligence
- ✅ Opportunity Detection
- ✅ Opportunity Tracking
- ✅ Basic Outcome Reporting
- ✅ Weekly Trends (basic lists)
- ✅ Free/Pro tiers with enforcement
- ✅ Auth (email + Google OAuth)
- ✅ Stripe billing

**Deferred to V1.1+:**
- Channel Benchmarking (requires YouTube OAuth, deferred per PRD)
- Opportunity Accuracy Scores (full detail for Pro - needs N>100 outcomes)
- Advanced trends with community insights (needs N=100+ outcomes)
- Grafana dashboards (defer until enough data)
- Contributor Badges (gamification can wait)
- Personalized Recommendations (needs channel data)

---

---

**END OF V1 DEVELOPMENT PLAN**

*The V1 plan above (Sections 1-12) is self-contained and ready for development. All features, tasks, and decisions for the 9-week V1 launch are defined.*

---

## Part II: Future Versions (V1.1+)

*The sections below contain features and improvements planned for future versions (V1.1, V1.2, etc.). These are NOT part of the V1 launch scope and can be ignored during initial development.*

---

## 13. Post-Launch Roadmap (V1.1+)

### Week 10-11: Monitoring & Fixes
- Monitor error rates (Sentry)
- Fix critical bugs
- Gather user feedback
- Track cost usage (stay within budget)

### Week 12: V1.1 Planning
- Prioritize feature requests
- Plan channel benchmarking (if traction)
- Evaluate need for separate frontend/backend services
- Assess if Grafana is needed yet

### Month 2-3: V1.1 Features
- Channel Benchmarking (YouTube OAuth)
- Opportunity Accuracy Scores (when N>100)
- Enhanced Outcome Reporting
- Contributor Badges
- Add Grafana dashboards (when enough data)

### Month 4+: V1.2+ Features
- Recipe Brief Templates
- Creator Following
- Collab Finder
- API for power users

---

## 14. Future Developments / Deferred Features

This section contains features and improvements that were part of the original plan but are deferred to V1.1+ for budget and time optimization. All items here are still planned, just prioritized for later phases.

### 14.1 Infrastructure Improvements

#### Separate Frontend/Backend Hosting

**Deferred:** V1 uses single Railway service (monorepo)  
**Future:** Split into separate services when scaling

**Benefits:**
- Better separation of concerns
- Independent scaling
- Isolated deployments

**When to Implement:**
- Traffic exceeds single service capacity
- Need independent scaling
- Budget allows ($10-40/month extra)

---

#### Grafana Cloud Dashboards

**Deferred:** V1 uses Sentry free tier only  
**Future:** Add Grafana Cloud in V1.1+

**Features to Add:**
- Business metrics dashboards
- Moat metrics tracking (correction rates, outcome accuracy)
- Custom business analytics
- Infrastructure monitoring
- Data pipeline metrics

**When to Implement:**
- Month 2-3 (when you have enough data to make dashboards useful)
- When free Sentry tier becomes limiting
- Budget allows ($0-50/month)

---

### 14.2 Testing Enhancements

#### Comprehensive Test Coverage

**Deferred:** V1 targets 50% coverage (critical paths)  
**Future:** Increase to 70-85% coverage in V1.1+

**Coverage Goals (V1.1+):**
- Frontend: 70%+ overall
- Backend: 80-85% for business logic
- tRPC Procedures: 80%+
- Database Queries: 70%+
- E2E Flows: 5-10 critical paths

**Benefits:**
- Higher confidence in changes
- Better code quality
- Easier refactoring

---

#### Advanced E2E Testing

**Deferred:** V1 has 2-3 E2E flows  
**Future:** Expand to 5-10 flows in V1.1+

**Additional Flows to Add:**
- Correction workflow end-to-end
- Outcome reporting flow
- Error handling scenarios
- Edge cases (empty states, error states)
- Performance testing

---

#### Full CI/CD Pipeline

**Deferred:** V1 uses basic CI (lint, type-check, unit tests)  
**Future:** Add integration tests, E2E in CI in V1.1+

**Pipeline Enhancements:**
- Integration tests with Docker services in CI
- E2E tests run on every PR
- Pre-commit hooks for quality checks
- Automated deployment strategies
- Rollback mechanisms

---

### 14.3 Rate Limiting Improvements

#### Redis-Based Rate Limiting

**Deferred:** V1 uses database-based rate limiting  
**Future:** Upgrade to Redis-based rate limiting in V1.1+

**Benefits:**
- Better performance (no database queries)
- More scalable
- Lower latency

**When to Implement:**
- When rate limit queries become slow
- When database load is too high
- When you need more sophisticated rate limiting

**Implementation:**
- Use Upstash Rate Limit library
- Replace database queries with Redis calls
- Maintain same rate limit rules

---

### 14.4 UI/UX Enhancements

#### Charts Library (Recharts)

**Deferred:** V1 uses simple HTML/CSS lists for trends  
**Future:** Add charts for data visualization in V1.1+

**Use Cases:**
- Trend visualization (line charts)
- Performance metrics (bar charts)
- User analytics (pie charts)
- Time series data

**When to Implement:**
- When trends dashboard needs better visualization
- When user analytics are mature
- When charts add clear value

---

#### Advanced Trends Dashboard

**Deferred:** V1 shows basic trends lists  
**Future:** Add community insights, charts, advanced filtering in V1.1+

**Features to Add:**
- Community insights ("12 tracked creators pursued this")
- Average outcome data ("18K views, 2.3x category avg")
- Trend charts (visualization over time)
- Advanced filtering (by cuisine, tags, etc.)
- Historical trend comparison

**When to Implement:**
- When you have N=100+ outcomes (enough data)
- When community insights become valuable
- When users request better visualization

---

### 14.5 Monitoring Enhancements

#### Sentry Performance Monitoring

**Deferred:** V1 uses Sentry error tracking only  
**Future:** Add Sentry Performance monitoring in V1.1+

**Features:**
- APM (Application Performance Monitoring)
- Request latency tracking (P50, P95, P99)
- Endpoint performance analysis
- Slow query detection

**When to Implement:**
- When performance becomes an issue
- When you need detailed performance metrics
- Budget allows ($26/month)

---

#### Prometheus Metrics Collection

**Deferred:** V1 uses Grafana's built-in data sources  
**Future:** Add Prometheus if needed in V1.2+

**Use Cases:**
- Custom application metrics
- Advanced metric aggregation
- Complex querying needs
- Long-term metric storage

**When to Implement:**
- When Grafana built-in sources are limiting
- When you need more advanced metrics
- When team grows (more complex needs)

---

#### Log Aggregation (Grafana Loki)

**Deferred:** V1 uses structured logging to files  
**Future:** Add log aggregation in V1.2+

**Features:**
- Centralized log collection
- Log search and filtering
- Log correlation with metrics
- Long-term log retention

**When to Implement:**
- When logs become difficult to manage
- When you need centralized log access
- When debugging complex issues

---

### 14.6 Architecture Improvements

#### Search Optimization (Algolia)

**Deferred:** V1 uses PostgreSQL Full-Text search only  
**Future:** Add Algolia if search performance becomes an issue in V1.2+

**Benefits:**
- Better search UX (typo tolerance, relevance)
- Faster search performance
- Better scalability

**When to Implement:**
- When PostgreSQL search is too slow
- When search volume is very high
- When better search UX is critical
- Budget allows ($59+/month)

---

#### Advanced Caching Strategies

**Deferred:** V1 uses basic Redis caching  
**Future:** Implement more sophisticated caching in V1.1+

**Improvements:**
- Cache warming strategies
- More granular cache invalidation
- Cache preloading for popular searches
- CDN integration for static assets

---

### 14.7 Summary: Deferred Features by Priority

| Priority | Feature | When (Estimate) | Cost Impact |
|----------|---------|-----------------|-------------|
| **High** | Grafana dashboards | Month 2-3 | $0-50/month |
| **High** | Community insights in trends | Month 2-3 | $0 |
| **Medium** | Redis rate limiting | Month 2-3 | $0-10/month |
| **Medium** | Test coverage increase | Month 2-3 | Time only |
| **Medium** | Separate hosting | When scaling | $10-40/month |
| **Low** | Recharts library | Month 3+ | $0 |
| **Low** | Sentry Performance | Month 3+ | $26/month |
| **Low** | Algolia search | Month 6+ | $59+/month |
| **Low** | Prometheus + Loki | Month 6+ | $50+/month |

---

**Note:** All deferred features remain part of the long-term plan. They're deferred not because they're unimportant, but because they can wait until you have:
1. Product-market fit validated
2. Enough users/data to make features valuable
3. Revenue to support additional costs
4. Time to implement properly

The focus for V1.1+ is: **Enhance and optimize based on validated product-market fit and user data.**

---

**END OF DOCUMENT**

*Part I (Sections 1-12) contains the complete V1 development plan, ready for implementation.*  
*Part II (Sections 13-14) contains future roadmap and deferred features for planning purposes.*
