# Kitvas V1: Product Requirements Document

**Version:** 3.0
**Last Updated:** February 2026
**Status:** Live — Shipped & Iterating

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [Architecture](#4-architecture)
5. [Core Features (Shipped)](#5-core-features-shipped)
6. [User Experience](#6-user-experience)
7. [Data Models](#7-data-models)
8. [API Surface](#8-api-surface)
9. [Infrastructure & Scripts](#9-infrastructure--scripts)
10. [Authentication & Access Control](#10-authentication--access-control)
11. [Business Model](#11-business-model)
12. [Target Users](#12-target-users)
13. [Success Metrics](#13-success-metrics)
14. [Future Roadmap](#14-future-roadmap)
15. [Risks & Mitigations](#15-risks--mitigations)

---

## 1. Product Vision

### 1.1 One-Liner

**"The intelligence platform for food content creators"**

### 1.2 Vision Statement

Kitvas helps food content creators make data-driven decisions about what recipes to film. By combining YouTube supply intelligence, search demand signals, Google Trends data, and content gap analysis, Kitvas reveals what audiences want to see — before the competition saturates it.

### 1.3 Why Now

- 700K-900K food creators need better tools
- No existing tool provides ingredient-level intelligence
- AI/ML enables real-time ingredient extraction at low cost
- Google Trends + YouTube data combined gives a uniquely powerful signal

---

## 2. Problem Statement

### 2.1 The Core Problem

**Food content creators waste time making videos nobody searches for.**

A creator spends 4-8 hours filming a recipe, only to discover:
- 50 other creators already made the same thing
- The ingredient combination has zero search demand
- A slight twist would have 10x the opportunity

### 2.2 Why Existing Solutions Fail

| Tool | What It Does | Why It's Not Enough |
|------|--------------|---------------------|
| VidIQ / TubeBuddy | Keyword SEO | Not ingredient-level |
| Google Trends | Search interest | Not recipe-specific |
| Manual YouTube search | See what exists | 2-3 hours per idea, no demand signal |

**The gap**: No tool combines supply + demand + content gap analysis at the ingredient level.

---

## 3. Solution Overview

### 3.1 The Two Intelligence Layers

| Layer | What It Provides | Data Source |
|-------|------------------|-------------|
| **Supply Intelligence** | What videos exist for this recipe | YouTube API + Groq LLM extraction |
| **Demand Intelligence** | What people are searching for | YouTube autocomplete + Google Trends |

### 3.2 How It Works (User Perspective)

1. **Search**: Enter 2+ ingredients → See existing videos, demand signals, content gaps
2. **Analyze**: View demand band (hot/growing/stable/niche), view counts, content saturation
3. **Discover**: Browse trending ingredients, find rising search queries, spot underserved niches
4. **Decide**: Use ingredient gap analysis and content angles to pick what to film next

---

## 4. Architecture

### 4.1 Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router) |
| **Backend** | Hono + tRPC |
| **Database** | PostgreSQL (Supabase) via Prisma ORM |
| **Auth** | NextAuth v5 (beta.30), Google OAuth |
| **AI/ML** | Groq LLM (ingredient + tag extraction) |
| **External APIs** | YouTube Data API v3, Google Trends |
| **Styling** | Tailwind CSS |

### 4.2 Key Architecture Patterns

- **Auth**: NextAuth v5 uses JWE (encrypted JWT). Backend decrypts with `jwtDecrypt` from `jose` library using HKDF key derivation
- **API Communication**: tRPC over HTTP batch link. Frontend passes `Authorization: Bearer <token>` header
- **Circular Dependency Prevention**: Individual routers import from `trpc.ts`, never from `router.ts`
- **Search Pipeline**: DB first → 24h cache check → YouTube API (rate-limited to 10/hour/user) → inline extraction → background processing
- **Caching**: YouTube results 24h TTL, Google Trends 1h TTL, demand signals persistent

### 4.3 Project Structure

```
kitvas/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Hono server entry
│   │   ├── router.ts             # tRPC app router (search, analytics, gaps)
│   │   ├── trpc.ts               # tRPC base, procedures (public, protected)
│   │   ├── routers/
│   │   │   ├── search.ts         # Search + autocomplete + transcripts
│   │   │   ├── analytics.ts      # Trending, dashboard, gaps, co-occurrence
│   │   │   └── gaps.ts           # Content gap analysis
│   │   ├── lib/                  # Business logic modules
│   │   ├── scripts/              # Data ingestion & maintenance
│   │   └── cron/                 # Scheduled jobs
│   └── prisma/
│       └── schema.prisma         # Database schema (16 models)
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages
│   │   ├── components/           # React components (11 files)
│   │   └── lib/                  # Auth config, tRPC types
│   └── public/                   # Static assets
└── docs/
    └── kitvas-v1.md              # This document
```

---

## 5. Core Features (Shipped)

### 5.1 Intelligent Recipe Search

**What it does:** Search by 2+ ingredients to see existing YouTube videos, demand signals, and content gaps.

**How it works:**
1. Query analyzed videos from database (with extracted ingredients, tags, relevance scoring)
2. Fallback to live YouTube API search (rate-limited, 24h cached)
3. Inline ingredient & tag extraction for fresh videos via Groq LLM
4. Background processing for remaining extraction work
5. Demand signal calculation from YouTube metrics + Google Trends boost

**Key details:**
- Minimum 2 ingredients required
- Results include: analyzed videos (with ingredients), fresh YouTube videos, demand band, demand signal details
- Guest users get 2 free searches per session before sign-in is required
- Search history saved to localStorage (last 5 searches)
- Search patterns logged to database for trend analysis

### 5.2 Demand Intelligence

**What it does:** Shows demand band (hot/growing/stable/niche/unknown) with supporting metrics.

**Signals used:**
- YouTube video view counts and age distribution
- Content gap scoring (underserved/saturated/balanced/emerging)
- Google Trends interest scores and week-over-week growth
- Breakout detection (>5000% growth indicators)

**Demand Bands:**
| Band | Score Range | Meaning |
|------|------------|---------|
| Hot | >70 | Strong demand, high view counts |
| Growing | 50-70 | Rising interest, good momentum |
| Stable | 30-50 | Consistent but not explosive |
| Niche | <30 | Low volume, specialized audience |
| Unknown | N/A | Insufficient data |

### 5.3 Content Gap Analysis

**What it does:** Identifies underserved ingredient combinations where demand exceeds supply.

**Gap types:**
- **Underserved**: High demand, few existing videos — best opportunity
- **Emerging**: New/rising interest with little competition
- **Balanced**: Fair competition relative to demand
- **Saturated**: Too many videos relative to demand

### 5.4 Ingredient Gap Discovery

**What it does:** Suggests missing ingredient pairings based on co-occurrence patterns and search data.

**How it works:**
- Analyzes which ingredients frequently appear together in videos
- Identifies combinations with demand signals but few existing videos
- Shows gap score and reasoning for each suggestion
- Users can click to add suggested ingredients to their search

### 5.5 Trending Ingredients

**What it does:** Shows currently trending ingredients powered by Google Trends data.

**Features:**
- Hot ingredients by period (today/week/month)
- Interest scores (0-100) with growth percentages
- Breakout indicators for explosive trends
- Rising search queries and content angle suggestions
- Clickable — adds trending ingredient to search bar

**Data pipeline:**
- Hourly Google Trends fetch job tracks top searched ingredients
- Keywords sourced from: top 20 user-searched ingredients (30 days), hot/growing demand signals, rising related queries
- Stored with worldwide region, 1h cache TTL

### 5.6 Ingredient Trend Sparklines

**What it does:** Shows search volume and video count trends over time for individual ingredients.

**Displays:**
- Daily/weekly/monthly trend data
- Search count vs. video count comparison
- Visual sparkline charts in search results

### 5.7 Content Angles

**What it does:** Suggests content angles based on rising search queries related to the searched ingredients.

**Sources:**
- Google Trends rising queries
- YouTube autocomplete suggestions
- Related search patterns from user data

### 5.8 Autocomplete

**What it does:** Ingredient suggestions as users type in the search bar.

**How it works:**
- Prefix matching against ingredient database
- Contains matching as fallback
- Synonym resolution (e.g., "chickens" → "chicken")
- Powered by Wikidata-sourced ingredient vocabulary

### 5.9 Transcript Access

**What it does:** Fetch and display video transcripts with automatic translation.

**Features:**
- Cached transcript retrieval
- Language detection
- English translation via Groq for non-English transcripts

---

## 6. User Experience

### 6.1 Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | SearchPage | Home page — hero, search input, trending ingredients, results |
| `/auth/signin` | SignInPage | Google OAuth sign-in with benefits list |

### 6.2 Key Components

| Component | Purpose |
|-----------|---------|
| **SearchInput** | Multi-ingredient input with autocomplete, tag filters, recent searches |
| **SearchResults** | Video cards, demand signals, ingredient gaps, content angles |
| **IngredientGaps** | Content gap opportunity cards with add-to-search |
| **ContentAngles** | Rising queries and angle suggestions |
| **TrendingIngredients** | Google Trends powered trending ingredient pills |
| **IngredientTrendSparkline** | Mini charts for ingredient search/video volume |
| **Navbar** | Logo, auth status, user dropdown with sign out |
| **LoginGate** | Blurs content behind sign-in prompt |
| **HeroFoodDecorations** | Animated SVG food illustrations |
| **CoffeeFooter** | Support/donation footer |

### 6.3 Access Control

| Feature | Guest | Signed In |
|---------|-------|-----------|
| Search | 2 per session | Unlimited |
| Trending ingredients | Blurred | Full access |
| Demand signal details | Blurred | Full access |
| Ingredient gaps | Blurred | Full access |
| Content angles | Blurred | Full access |
| Sparkline trends | Blurred | Full access |
| Autocomplete | Available | Available |

### 6.4 Design Principles

1. **Single-page app feel**: Search and results on the same page, hero collapses on search
2. **Progressive disclosure**: Teaser content visible to guests, details behind sign-in
3. **Low friction**: Google OAuth only, no email/password
4. **Data-forward**: Numbers, bands, and scores front and center

---

## 7. Data Models

### 7.1 Core Models (16 total)

**Auth & Users:**
- `User` — Accounts with subscription tier (free/pro)
- `Account` — OAuth account linking (Google)
- `Session` — Auth session management
- `VerificationToken` — Email verification

**Video Intelligence:**
- `Video` — YouTube videos with transcript, views, channel, publish date
- `VideoIngredient` — Extracted ingredients with confidence and source (title/description/transcript)
- `VideoTag` — Cooking method, dietary, and cuisine tags with confidence

**Ingredient Knowledge:**
- `Ingredient` — Canonical ingredient names
- `IngredientSynonym` — Aliases from manual, Wikidata, or user sources
- `IngredientTrend` — Daily/weekly/monthly search and video counts

**Analytics & Demand:**
- `Search` — Logged searches with ingredients, result count, demand band
- `DemandSignal` — Cached demand metrics per ingredient combination

**Google Trends:**
- `GoogleTrend` — Interest over time data (0-100 scores, breakout flags)
- `GoogleTrendRelatedQuery` — Rising/top related queries
- `GoogleTrendsCache` — API response cache with TTL
- `GoogleTrendsJobLog` — Job execution tracking

**Job Management:**
- `IngredientFetchJob` — External source ingestion tracking

---

## 8. API Surface

### 8.1 tRPC Router Structure

```
appRouter
├── search
│   ├── autocomplete          (public)  — Ingredient suggestions
│   ├── search                (public)  — Main search with YouTube fallback
│   ├── getTranscript         (public)  — Cached video transcript
│   └── translateTranscript   (public)  — Transcript translation
├── analytics
│   ├── hotIngredients        (public)  — Trending from Google Trends
│   ├── relatedAngles         (public)  — Rising queries & content angles
│   ├── trending              (public)  — Trending by search volume
│   ├── seasonal              (public)  — Monthly popularity patterns
│   ├── contentGaps           (public)  — Underserved combinations
│   ├── coOccurrence          (public)  — Ingredients searched together
│   ├── dashboard             (public)  — Summary for insights UI
│   ├── ingredientTrends      (public)  — Sparkline data
│   └── topIngredientTrends   (public)  — Top ingredients by velocity
└── gaps
    └── findGaps              (public)  — Content gap analysis
```

### 8.2 Auth Procedures

| Procedure Type | Usage |
|---------------|-------|
| `t.procedure` (public) | All current endpoints — search, analytics, gaps |
| `protectedProcedure` | Available but currently unused (reserved for future features) |

---

## 9. Infrastructure & Scripts

### 9.1 Backend Scripts

| Script | Purpose | Schedule |
|--------|---------|----------|
| `fetch-google-trends.ts` | Fetch Google Trends interest data | Hourly (cron) |
| `daily-batch-job.ts` | Main daily processing orchestration | Daily (cron) |
| `aggregate-trends.ts` | Aggregate trend data | Part of daily batch |
| `populate-ingredient-trends.ts` | Calculate trend snapshots | Part of daily batch |
| `refresh-views.ts` | Update video view counts from YouTube | Part of daily batch |
| `ingest-videos.ts` | Batch YouTube video crawling | Manual / on-demand |
| `import-public-recipes.ts` | Public recipe dataset import | One-time |
| `fetch-wikidata-ingredients.ts` | SPARQL query for food ingredients | One-time |
| `backfill-transcripts.ts` | Fetch missing video transcripts | Manual |
| `backfill-translations.ts` | Backfill transcript translations | Manual |
| `audit-data.ts` | Data quality and consistency checks | Manual |

### 9.2 Background Processing

- **Ingredient extraction queue**: Batch Groq LLM calls for video ingredients
- **Tag extraction**: Cooking method, dietary, cuisine classification
- **Rate limiting**: In-memory, 10 YouTube API searches per hour per user/IP
- **Search cache**: 24h TTL for YouTube API results

### 9.3 Environment Variables

**Frontend:**
```
NEXT_PUBLIC_API_URL              # Backend URL (default: http://localhost:4001)
NEXT_PUBLIC_ENVIRONMENT          # development | production
NEXT_PUBLIC_STRIPE_COFFEE_LINK   # Optional donation link
AUTH_SECRET                      # 32-byte base64 for NextAuth JWE
NEXTAUTH_URL                     # Frontend URL (default: http://localhost:3000)
GOOGLE_CLIENT_ID                 # Google OAuth client ID
GOOGLE_CLIENT_SECRET             # Google OAuth client secret
```

**Backend:**
```
DATABASE_URL                     # PostgreSQL connection string (Supabase)
YOUTUBE_API_KEY                  # YouTube Data API v3 key
GROQ_API_KEY                     # Groq API key for LLM extraction
AUTH_SECRET                      # Same as frontend (for JWE decryption)
INTERNAL_BROADCAST_SECRET        # SSE broadcast authentication
```

---

## 10. Authentication & Access Control

### 10.1 Auth Flow

1. User clicks "Sign in with Google" → NextAuth initiates Google OAuth with YouTube read-only scope
2. NextAuth v5 creates JWE-encrypted session token (NOT signed JWT)
3. Frontend stores token in cookie (`authjs.session-token` in dev, `__Secure-authjs.session-token` in prod)
4. Frontend sends token via `Authorization: Bearer <token>` in tRPC requests
5. Backend decrypts using `jwtDecrypt` from jose with HKDF-derived key

### 10.2 Guest vs. Authenticated

- Guests can perform 2 searches per session (tracked via sessionStorage)
- After limit, a sign-up prompt modal appears
- Authenticated users get unlimited searches
- Trending ingredients, demand details, and ingredient gaps are behind a `LoginGate` blur for guests

---

## 11. Business Model

### 11.1 Current State

| Tier | Price | Features |
|------|-------|----------|
| **Guest** | Free | 2 searches per session, basic results |
| **Signed In** | Free | Unlimited searches, full demand signals, trending data, gaps |
| **Pro** | $12/month (planned) | Channel benchmarking, personalized recommendations |

### 11.2 Monetization Strategy

- Phase 1 (current): Free with sign-in gate to build user base and data
- Phase 2 (planned): Pro tier with YouTube channel benchmarking
- Support: Optional coffee/donation link in footer

---

## 12. Target Users

### 12.1 Primary User: The Growing Creator

**Profile:**
- Channel size: 5,000 - 100,000 subscribers
- Posting frequency: 1-3 videos per week
- Revenue: $200-2,000/month from content
- Mindset: Treats content creation as a business

**What they get from Kitvas:**
- Save 2-3 hours of manual research per video idea
- Discover underserved ingredient combinations
- Validate ideas with demand signals before filming
- Spot trending ingredients early

### 12.2 Anti-Personas

| Anti-Persona | Why Not |
|--------------|---------|
| Casual home cooks | No YouTube content strategy |
| Large food brands | Different tooling needs |
| Non-food creators | Platform is food-specific |

---

## 13. Success Metrics

### 13.1 Product Metrics

| Metric | Target |
|--------|--------|
| Searches per day | Growing week-over-week |
| Sign-in conversion (guest → authenticated) | > 30% |
| Return users (7-day) | > 40% |
| Search latency (P95) | < 2s |
| Ingredient extraction accuracy | > 85% |

### 13.2 Data Metrics

| Metric | Purpose |
|--------|---------|
| Videos in database | Supply intelligence coverage |
| Ingredients in vocabulary | Autocomplete quality |
| Google Trends keywords tracked | Demand signal breadth |
| Demand signals cached | Response speed |

---

## 14. Future Roadmap

### 14.1 Near-Term (V1.1)

| Feature | Description |
|---------|-------------|
| Channel Benchmarking | Connect YouTube channel, see how your videos compare by ingredient |
| Pro Tier + Stripe | $12/month subscription with Stripe billing |
| Personalized Recommendations | Suggest ingredients based on channel history |

### 14.2 Medium-Term (V1.2+)

| Feature | Description |
|---------|-------------|
| TikTok/Instagram Support | Expand beyond YouTube |
| Creator Following | Social graph and shared intelligence |
| Recipe Brief Templates | Downloadable research briefs |
| Notification Alerts | Email/push for trending ingredients in your niche |

### 14.3 Removed Features (Previously Planned)

The following features were designed in earlier PRD versions but removed during development to focus the product:

| Feature | Reason for Removal |
|---------|-------------------|
| Ingredient Correction System | Premature — needs larger user base first |
| Opportunity Tracking & Outcomes | Over-engineered for current stage |
| Admin Labeling Panel | Unnecessary complexity |
| Gamification / Badges | No user base to gamify yet |
| Opportunity Accuracy Scores | Requires outcome data that doesn't exist yet |

These may be revisited once the core search + demand intelligence product has proven traction.

---

## 15. Risks & Mitigations

### 15.1 Product Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Creators don't value ingredient-level data | Critical | Validate with beta users, iterate on value prop |
| Free tier too generous | High | Sign-in gate provides data; Pro tier coming |
| Search results not accurate enough | High | Groq LLM extraction + synonym database + continuous vocabulary expansion |

### 15.2 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| YouTube API quota exhaustion | High | Rate limiting (10/hour/user), 24h result caching |
| Google Trends rate limiting | Medium | 1h cache TTL, keyword prioritization |
| Groq API costs scaling | Medium | Background batch processing, caching extraction results |
| Database growth | Medium | Supabase managed PostgreSQL, indexes on key queries |

### 15.3 Execution Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Solo founder bandwidth | High | Strict scope, ship lean |
| Scope creep | Medium | PRD locked, defer to future versions |
| Competition | Low | No one does ingredient-level intelligence yet |

---

**End of Document**

*This PRD reflects the actual shipped state of Kitvas as of February 2026. Features are documented based on what exists in the codebase, not aspirational plans.*
