# Deployment Guide (Railway)

Kitvas runs as 3 services on Railway, all from the same monorepo.

## Services

| Service | Root Directory | Build Command | Start Command | Port |
|---------|---------------|---------------|---------------|------|
| Frontend | `frontend` | `npm run build` | `npm start` | 3000 |
| Backend API | `backend` | `npm run build` | `node dist/index.js` | 4001 |
| Scheduler | `backend` | `npm run build` | `node dist/cron/scheduler.js` | — |

## Setup

### 1. Create Railway project

1. Go to [railway.app](https://railway.app) and create a new project
2. Connect your GitHub repository
3. Create 3 services from the same repo (one per row in the table above)
4. Set the **Root Directory** for each service

### 2. Database

Use your existing Supabase PostgreSQL database:
- Use the **pooler** connection string (port 6543) for `DATABASE_URL` in Backend API and Scheduler
- Use the **direct** connection string (port 5432) when running migrations locally

### 3. Environment variables

#### Frontend
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_STRIPE_COFFEE_LINK=https://buy.stripe.com/your-link
AUTH_SECRET=<same as backend>
NEXTAUTH_URL=https://your-frontend.railway.app
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

#### Backend API
```
DATABASE_URL=postgresql://...
YOUTUBE_API_KEY=<your-key>
GROQ_API_KEY=<your-key>
AUTH_SECRET=<same as frontend>
RESEND_API_KEY=<your-key>
ALERT_FROM_EMAIL=Kitvas <alerts@yourdomain.com>
INTERNAL_BROADCAST_SECRET=<random-string>
ALLOWED_ORIGINS=https://your-frontend.railway.app
PORT=4001
ENVIRONMENT=production
```

#### Scheduler
```
DATABASE_URL=postgresql://...
YOUTUBE_API_KEY=<your-key>
GROQ_API_KEY=<your-key>
RESEND_API_KEY=<your-key>
INTERNAL_BROADCAST_SECRET=<same as backend>
INTERNAL_BROADCAST_URL=https://your-backend.railway.app/internal/broadcast-trends
```

### 4. Google OAuth

Add your production callback URL to Google Cloud Console:
```
https://your-frontend.railway.app/api/auth/callback/google
```

### 5. Custom domain (optional)

1. In Railway, go to your Frontend service settings
2. Add a custom domain
3. Update `NEXTAUTH_URL` and `ALLOWED_ORIGINS` accordingly

## Stripe donations

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) > Payment Links
2. Create a new Payment Link (~$5, one-time, "Buy me a coffee")
3. Copy the URL and set it as `NEXT_PUBLIC_STRIPE_COFFEE_LINK`

## Resend email

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (or use Resend's test domain for development)
3. Create an API key and set `RESEND_API_KEY`
4. Set `ALERT_FROM_EMAIL` to an address on your verified domain

## Monitoring

- Railway provides built-in logs for each service
- Check `GoogleTrendsJobLog` table for cron job status
- Check `SentAlert` table for email delivery history

## Troubleshooting

### CORS errors
Ensure `ALLOWED_ORIGINS` includes your frontend URL (no trailing slash).

### Auth not working
- `AUTH_SECRET` must be identical in frontend and backend
- `NEXTAUTH_URL` must match the actual frontend URL
- Google OAuth callback URL must be registered in Google Cloud Console

### Scheduler not running
Check Railway logs for the scheduler service. The scheduler runs jobs on a cron schedule — it won't produce output until a job fires.
