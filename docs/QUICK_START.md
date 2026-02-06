# Quick Start: Video Ingestion

## Step 1: Create `.env` file

Create a file named `.env` in the `backend/` directory with:

```bash
# Database connection (required)
DATABASE_URL="postgresql://user:password@localhost:5432/kitvas"

# YouTube API key (required)
YOUTUBE_API_KEY="your-youtube-api-key-here"

# Groq API key (recommended for better ingredient extraction)
# Get free key at: https://console.groq.com/
GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## Step 2: Get a YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable "YouTube Data API v3"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the API key and add it to your `.env` file

## Step 3: Set up Database

If you haven't set up your database yet:

```bash
cd backend
npm run db:generate
npm run db:push
```

## Step 4: Run Ingestion

```bash
npm run ingest:videos
```

## Example `.env` file

```bash
# For Supabase - USE CONNECTION POOLER (recommended for scripts)
# Get this from: Project Settings → Database → Connection string → Connection Pooling → URI
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# OR use Transaction mode (also works without IP allowlisting)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true"

# ❌ DON'T use direct connection (port 5432) - requires IP allowlisting
# DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# For local PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/kitvas"

# YouTube API
YOUTUBE_API_KEY="AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Groq API (for ingredient extraction - free tier available)
GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Auth (same secret as frontend, for JWT verification)
AUTH_SECRET="your-nextauth-secret"

# Optional
PORT=4001
ENVIRONMENT=development
```

## Troubleshooting

### "DATABASE_URL not found"
- Make sure `.env` file exists in `backend/` directory
- Check that the file is named exactly `.env` (not `.env.example`)
- Verify the DATABASE_URL format is correct

### "YOUTUBE_API_KEY not found"
- Add YOUTUBE_API_KEY to your `.env` file
- Make sure there are no quotes around the value (or use double quotes)

### Slow ingredient extraction or "GROQ_API_KEY not found"
- Add GROQ_API_KEY to your `.env` file for faster, more accurate ingredient extraction
- Get a free API key from [Groq Console](https://console.groq.com/)
- Without it, the system falls back to keyword-based extraction (still works, but less accurate)

### "Can't reach database server" (Supabase)

**This usually means you're using the wrong connection string format.**

1. **Use Connection Pooler (Recommended):**
   - Go to Supabase Dashboard → Your Project → Settings → Database
   - Scroll to "Connection string"
   - Select "Connection Pooling" tab
   - Choose "Transaction" mode
   - Copy the URI connection string
   - It should look like: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true`
   - Or use port 6543: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

2. **Check if project is paused:**
   - Free tier Supabase projects pause after inactivity
   - Go to dashboard and click "Restore" if paused
   - Wait 1-2 minutes for it to start

3. **If using direct connection (port 5432):**
   - You need to allowlist your IP address
   - Go to Settings → Database → Network Restrictions
   - Add your current IP address
   - But it's easier to just use the connection pooler instead!

### Database connection errors (local)
- Verify PostgreSQL is running: `pg_isready` or `brew services list` (Mac)
- Check the connection string format
- Make sure the database exists: `createdb kitvas` (if needed)
