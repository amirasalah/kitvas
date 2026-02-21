# Kitvas Setup Guide

## Prerequisites

- Node.js 20 or higher
- PostgreSQL database (Supabase)
- npm

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces (frontend, backend, shared).

### 2. Set Up Database

1. Create a PostgreSQL database (via Supabase)
2. Copy `.env.example` files to `.env` in each workspace:
   - `backend/.env` - Database URL and API keys
   - `frontend/.env.local` - Backend API URL

3. Update `backend/.env` with your database URL.
   - **Supabase:** Use the **direct** connection (port **5432**) for `db:push` and migrations.  
     The pooler (port 6543) does not support DDL—tables will not be created.  
     In Dashboard → Project Settings → Database, use the **URI** under "Connection string"  
     and ensure the host uses port **5432** (e.g. `...pooler.supabase.com:5432/postgres`).

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
GROQ_API_KEY="gsk_..." (for ingredient extraction - free tier available at console.groq.com)
YOUTUBE_API_KEY="AIza..." (for YouTube search)
AUTH_SECRET="your-nextauth-secret" (same value as frontend, for JWT verification)
RESEND_API_KEY="" (optional - for breakout email alerts, get from resend.com)
PORT=4001
ENVIRONMENT=development
```

#### Frontend (`frontend/.env`)
```
NEXT_PUBLIC_API_URL="http://localhost:4001"
NEXT_PUBLIC_ENVIRONMENT="development"

# NextAuth.js
AUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (get from https://console.cloud.google.com/apis/credentials)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret"
```

**Google OAuth Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID (Web application)
3. Add `http://localhost:3000/api/auth/callback/google` to Authorized redirect URIs
4. Copy Client ID and Client Secret to `frontend/.env`

### 4. Run Development Servers

From the root directory:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:4001

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

✅ **Shipped:**
- Project structure (monorepo with frontend, backend, shared)
- Next.js 14 frontend with App Router
- Hono backend with tRPC (5 routers: search, analytics, gaps, alerts, dashboard)
- Prisma schema with 22 models
- YouTube API integration with inline extraction
- Ingredient extraction (Groq LLM + keyword fallback)
- Ingredient synonym mapping & normalization (100+ canonical forms)
- Tag detection system (cooking methods, dietary, cuisine)
- Tag filtering in search UI
- Search UI with ingredient input and demand intelligence
- Content gap analysis (underserved/saturated/balanced/emerging)
- Ingredient gap finder (aggregated search pattern analysis)
- Google Trends integration (external demand validation, hourly fetch)
- Automated cron job scheduler (node-cron + PM2)
- Hot Ingredients UI (trending ingredients display)
- Authentication (NextAuth v5 + Google OAuth, JWE token verification)
- Guest/signed-in feature gating
- Breakout ingredient email alerts (Resend)
- Food Trend Dashboard (Overview, YouTube, Websites tabs)
- 12 food publication RSS feeds (Serious Eats, Bon Appetit, Food Network, etc.)
- Cross-platform trending topic aggregation
- Donation support (Stripe Payment Link)
- Open source (MIT license)
- E2E test suites: 70 backend API tests (Vitest) + 47 Playwright browser tests

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

## 6. Run Scheduled Jobs

Kitvas includes a centralized scheduler for automated data collection:

### Using PM2 (Recommended for Local Development)

```bash
cd backend

# Start both API and scheduler
pm2 start ecosystem.config.cjs

# Check status
pm2 status

# View scheduler logs
pm2 logs kitvas-scheduler

# Stop all processes
pm2 stop all
```

### Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Google Trends Fetch | Hourly at :00 | Fetch trending data for top ingredients (worldwide) |
| Daily Batch Job | 2:00 AM | Ingest new YouTube videos |
| Trends Aggregation | 12:10 AM | Aggregate search trends |
| View Count Refresh | 3:00 AM Sunday | Refresh YouTube view counts |
| Wikidata Ingredients | 6:00 AM Wednesday | Fetch ingredients from Wikidata |
| YouTube Trending | Every 30 min | Fetch trending food videos for dashboard |
| RSS Food Websites | Hourly | Fetch articles from 12 food publication RSS feeds |
| Trend Aggregation | Every 15 min | Cross-platform trending topic aggregation |

### Manual Execution

Run individual jobs manually:

```bash
cd backend

# Fetch Google Trends data
npm run trends:daily

# Run batch video ingestion
npm run batch:daily

# Aggregate trends data
npm run aggregate:trends

# Start scheduler daemon (runs jobs on schedule)
npm run scheduler
```

### Monitoring Jobs

Check job execution status in the database:

```bash
# Open Prisma Studio
npm run db:studio
# Navigate to GoogleTrendsJobLog table
```

## Testing the Search Feature

Once your database is set up:

1. Start the development servers:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000

3. Enter at least 2 ingredients in the search box (e.g., "miso", "pasta")
   - Type ingredients separated by commas (space adds comma automatically)
   - Press Enter to search (requires minimum 2 ingredients)
   - You can add up to 10 ingredients
   - Only videos matching ALL searched ingredients (100% match) are shown

4. Use tag filters to narrow results by cooking method, dietary info, or cuisine

5. Results will show:
   - **Demand Signal**: HOT/GROWING/STABLE/NICHE indicator with score
   - **Content Gaps**: Underserved ingredient combinations
   - **Videos**: With AI-detected ingredients and tags
   - **Relevance Score**: How well each video matches your search

6. View ingredient gaps and content angles for deeper market insights

## Troubleshooting

### Supabase: 0 tables after `db:push`
If `prisma db push` completes but Table Editor shows 0 tables, you are likely using the **pooler** (port 6543). Use the **direct** connection (port **5432**) in `DATABASE_URL` when running migrations. Change the host from `...:6543` to `...:5432`, run `npm run db:push` again, then check Table Editor.

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
