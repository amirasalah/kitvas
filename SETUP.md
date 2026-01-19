# Kitvas Setup Guide

## Prerequisites

- Node.js 20 or higher
- PostgreSQL database (Supabase)
- npm or yarn

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces (frontend, backend, shared).

### 2. Set Up Database

1. Create a PostgreSQL database (via Supabase or local PostgreSQL)
2. Copy `.env.example` files to `.env` in each workspace:
   - `backend/.env` - Database URL and API keys
   - `frontend/.env.local` - Backend API URL

3. Update `backend/.env` with your database URL:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/kitvas"
   ```

4. Generate Prisma client and run migrations:
   ```bash
   cd backend
   npm run db:generate
   npm run db:push
   ```

### 3. Set Up Environment Variables

#### Backend (`backend/.env`)
```
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..." (optional for now)
ANTHROPIC_API_KEY="sk-ant-..." (for Week 2)
YOUTUBE_API_KEY="AIza..." (for Week 1)
PORT=3001
ENVIRONMENT=development
```

#### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_ENVIRONMENT="development"
```

### 4. Run Development Servers

From the root directory:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

Or run separately:
```bash
npm run dev:frontend  # Frontend only
npm run dev:backend   # Backend only
```

## Project Structure

```
kitvas/
├── frontend/          # Next.js 14 app
├── backend/           # Hono + tRPC API
├── shared/            # Shared types
└── package.json       # Root workspace config
```

## Current Status

✅ **Week 1 Tasks Completed:**
- Project structure set up
- Next.js frontend initialized
- Hono backend with tRPC
- Prisma schema defined
- Basic search UI implemented

🚧 **In Progress:**
- Search functionality implementation
- Database setup

📋 **Next Steps:**
- Set up YouTube API integration (Week 1)
- Implement ingredient extraction (Week 2)
- Complete search with ranking (Week 3)

## 5. Ingest Videos from YouTube

Once your database is set up, you can ingest videos to populate the database:

1. Make sure `YOUTUBE_API_KEY` is set in `backend/.env`
2. Get a YouTube Data API key from [Google Cloud Console](https://console.cloud.google.com/)
3. Run the ingestion script:

```bash
cd backend

# Ingest videos with default queries (miso pasta, gochujang chicken, etc.)
npm run ingest:videos

# Or specify custom queries
npm run ingest:videos -- --query "miso pasta recipe" --max 50

# Or multiple queries at once
npm run ingest:videos -- --queries "miso pasta,gochujang chicken,air fryer tofu" --max 30
```

The script will:
- Search YouTube for each query
- Fetch video details (title, description, thumbnails, views)
- Store videos in the database
- Skip videos that already exist

**Note:** The script includes rate limiting to avoid hitting YouTube API quotas.

## Testing the Search Feature

Once you've ingested some videos:

1. Start the development servers:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000

3. Enter ingredients in the search box (e.g., "miso", "pasta")
   - Press Enter to add each ingredient
   - You can add up to 10 ingredients

4. Results will appear automatically, ranked by relevance

**Note:** Search results will be empty until you:
- Ingest videos (see step 5 above)
- Extract ingredients from videos (Week 2 task)

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Ensure database exists

### tRPC Type Errors
- Run `npm run type-check` in both frontend and backend
- Ensure shared package is built

### Port Already in Use
- Change PORT in backend/.env
- Update NEXT_PUBLIC_API_URL in frontend/.env.local
