# Kitvas V1

The intelligence platform for food content creators.

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

- **Ingredient-based Search**: Search by ingredients, see relevant recipe videos
- **Tag Filtering**: Filter by cooking method (air fryer, oven, etc.), dietary (vegan, keto, etc.), and cuisine (korean, italian, etc.)
- **Demand Intelligence**: View demand signals (HOT/GROWING/STABLE/NICHE) with scores
- **Content Opportunities**: Discover gaps in the market (quality_gap, freshness_gap, underserved, trending)
- **Ingredient Detection**: AI-powered extraction with synonym normalization (100+ canonical forms)
- **Correction System**: Click ingredients to correct detection errors (moat feature)
- **Opportunity Tracking**: Track and manage content ideas through your pipeline
- **Outcome Reporting**: Report video performance to calibrate prediction accuracy
- **Admin Labeling**: Label and export training data for model improvement (`/admin/label`)
