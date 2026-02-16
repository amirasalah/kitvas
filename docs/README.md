# Kitvas

**Intelligence platform for food content creators.**

Kitvas helps recipe video creators understand market demand, discover underserved ingredient combinations, and find content gaps that YouTube can't show you.

## What Makes Kitvas Different

While YouTube shows you what already exists, Kitvas shows you what's **missing**:

- **Demand Signals**: See actual view counts, market saturation, and content gaps for any ingredient combination
- **Ingredient Gap Finder**: "Others searched lamb + rice + sumac (47 searches, only 2 videos)" — that's your opportunity
- **Google Trends Integration**: External validation of trending ingredients with breakout detection

### Data Moat

Kitvas builds proprietary data assets that compound over time:

1. **Search Patterns**: Aggregated search behavior reveals what creators want to make
2. **Ingredient Intelligence**: AI-extracted ingredient data across thousands of videos
3. **Trend Correlation**: Google Trends + YouTube metrics combined for validated demand signals

## Project Structure

This is a monorepo containing:

- `frontend/` - Next.js 14 application (App Router)
- `backend/` - Hono API server with tRPC
- `shared/` - Shared types and utilities

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL database (Supabase)

### Installation

```bash
npm install
```

### Development

```bash
# Run both frontend and backend
npm run dev

# Or run separately
npm run dev:frontend
npm run dev:backend
```

### Environment Variables

See `SETUP.md` for detailed environment variable setup.

**Quick setup:**
1. Create `backend/.env` with:
   ```
   DATABASE_URL="postgresql://..."
   YOUTUBE_API_KEY="your-api-key"
   GROQ_API_KEY="your-groq-api-key"  # Free at console.groq.com
   ```

2. Create `frontend/.env` with:
   ```
   NEXT_PUBLIC_API_URL="http://localhost:4001"
   AUTH_SECRET="your-auth-secret"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="GOCSPX-your-secret"
   ```

### Database Setup

```bash
cd backend
npm run db:generate
npm run db:push
```

### Ingest Videos

To populate the database with YouTube videos:

```bash
cd backend
npm run ingest:videos
```

Or with custom queries:
```bash
npm run ingest:videos -- --query "miso pasta recipe" --max 50
npm run ingest:videos -- --queries "miso pasta,gochujang chicken" --max 30
```

### Run Scheduled Jobs

Start the automated scheduler with PM2:
```bash
cd backend
pm2 start ecosystem.config.cjs
pm2 status
```

Or run individual jobs manually:
```bash
npm run trends:hourly     # Fetch Google Trends data (runs hourly by default)
npm run batch:daily       # Ingest YouTube videos
npm run aggregate:trends  # Aggregate trends into demand signals
npm run scheduler         # Start scheduler daemon
```

See `SETUP.md` for more details.

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, shadcn/ui, tRPC, NextAuth v5 (Google OAuth)
- **Backend**: Hono, tRPC, Prisma, PostgreSQL, jose (JWT verification)
- **AI**: Groq (Llama 3.3 70B) for ingredient extraction
- **Auth**: NextAuth v5 (beta.30) with JWE tokens, decrypted on backend via jose
- **Infrastructure**: Railway, Supabase

## Features

### Core Search & Discovery
- **Ingredient-based Search**: Search by 2+ ingredients — all searched ingredients must be present in a video
- **Title + Ingredient Matching**: Matches both extracted ingredients and dish names in video titles via synonym expansion
- **Tag Filtering**: Filter by cooking method (air fryer, oven, etc.), dietary (vegan, keto, etc.), and cuisine (korean, italian, etc.)
- **Demand Intelligence**: View demand signals (HOT/GROWING/STABLE/NICHE) with scores
- **Content Gap Analysis**: Discover market conditions — underserved, saturated, balanced, or emerging
- **Hot Ingredients**: Browse trending ingredients by time period (today/week/month) with growth indicators

### AI-Powered Extraction
- **Ingredient Detection**: AI-powered extraction with synonym normalization (100+ canonical forms)
- **Transcript-First Extraction**: Transcripts are the primary source (confidence 0.95), with title/description supplementary
- **Tag Detection**: Automatic cooking method, dietary, and cuisine tag classification

### Intelligence Features
- **Ingredient Gap Finder**: Shows underserved ingredient combinations based on aggregated search patterns
- **Content Angles**: Related trending queries surfaced as content angle suggestions
- **Analytics API**: Trending ingredients, seasonal patterns, content gaps, co-occurrence data

### Authentication
- **Google OAuth**: Sign in with Google via NextAuth v5
- **JWT Verification**: Backend decrypts NextAuth JWE tokens using jose library
- **Guest Access**: Core search and analytics available without login; advanced features gated behind sign-in

### Google Trends Integration
- **External Validation**: Google Trends data validates internal demand signals
- **Breakout Detection**: Identifies ingredients with >5000% growth
- **Rising Queries**: Discover related trending queries for content angle ideas
- **Automated Fetching**: Hourly cron job fetches trends for top ingredients (worldwide region)
