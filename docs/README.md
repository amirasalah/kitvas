# Kitvas

**Intelligence platform for food content creators.**

Kitvas helps recipe video creators discover content opportunities, understand market demand, and find underserved ingredient combinations that YouTube can't show you.

## What Makes Kitvas Different

While YouTube shows you what already exists, Kitvas shows you what's **missing**:

- **Demand Signals**: See actual view counts, market saturation, and content gaps for any ingredient combination
- **Content Opportunities**: Discover ingredient combinations with high search demand but low video supply
- **Ingredient Gap Finder**: "Others searched lamb + rice + sumac (47 searches, only 2 videos)" — that's your opportunity

### The Moat

Kitvas builds proprietary data assets that compound over time:

1. **Search Patterns**: Aggregated search behavior reveals what creators want to make
2. **User Corrections**: Crowdsourced ingredient corrections improve AI accuracy
3. **Outcome Tracking**: Real performance data calibrates opportunity predictions

## Project Structure

This is a monorepo containing:

- `frontend/` - Next.js 14 application (App Router)
- `backend/` - Hono API server with tRPC
- `shared/` - Shared types and utilities

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- PostgreSQL database (Supabase)
- Redis (Upstash for production)

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

2. Create `frontend/.env.local` with:
   ```
   NEXT_PUBLIC_API_URL="http://localhost:3001"
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

See `SETUP.md` for more details.

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, shadcn/ui, tRPC
- **Backend**: Hono, tRPC, Prisma, PostgreSQL
- **AI**: Groq (Llama 3.3 70B) for ingredient extraction
- **Infrastructure**: Railway, Supabase, Upstash Redis

## Features (V1)

### Core Search & Discovery
- **Ingredient-based Search**: Search by ingredients, see relevant recipe videos
- **Tag Filtering**: Filter by cooking method (air fryer, oven, etc.), dietary (vegan, keto, etc.), and cuisine (korean, italian, etc.)
- **Demand Intelligence**: View demand signals (HOT/GROWING/STABLE/NICHE) with scores
- **Content Opportunities**: Discover gaps in the market (quality_gap, freshness_gap, underserved, trending)

### AI-Powered Extraction
- **Ingredient Detection**: AI-powered extraction with synonym normalization (100+ canonical forms)
- **Transcript Support**: Extract ingredients from video transcripts (not just title/description)
- **Dynamic Blocklist**: User corrections automatically improve extraction accuracy

### User Features (Moat)
- **Ingredient Gap Finder**: Shows underserved ingredient combinations based on aggregated search patterns — what YouTube can't show
- **Correction System**: Click ingredients to correct detection errors, improving AI accuracy for everyone
- **Opportunity Tracking**: Track and manage content ideas through your pipeline
- **Outcome Reporting**: Report video performance to calibrate prediction accuracy

### ML Training & Analytics
- **Analytics API**: Trending ingredients, seasonal patterns, content gaps, co-occurrence
- **Extraction Feedback Loop**: Corrections aggregate into blocklist/allowlist patterns
- **Opportunity Calibration**: Predictions improve from actual outcome data
- **Accuracy Tracking**: Historical precision/recall/F1 snapshots

### Admin Tools
- **Admin Labeling**: Label and export training data for model improvement (`/admin/label`)
- **Dataset Export**: JSON/CSV export with train/validation/test splits
