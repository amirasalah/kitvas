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
- **Infrastructure**: Railway, Supabase, Upstash Redis
