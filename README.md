# Kitvas

Ingredient-level intelligence for food creators. Kitvas helps YouTube recipe creators find untapped ingredient combinations, spot trending ingredients, and identify content gaps.

## What it does

- **Search ingredient combinations** — Enter 2+ ingredients and get demand signals, content gaps, and video analysis
- **Trending ingredients** — Live Google Trends integration shows what's hot right now
- **Content gap detection** — Find underserved ingredient pairings with high demand
- **Ingredient gap analysis** — Discover missing ingredients in popular combinations
- **Breakout alerts** — Get email notifications when ingredients experience explosive growth

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, Tailwind CSS |
| Backend | Hono, tRPC |
| Database | PostgreSQL (Supabase), Prisma ORM |
| Auth | NextAuth v5, Google OAuth |
| Extraction | Groq LLM (llama-3.3-70b-versatile) |
| Trends | Google Trends (unofficial API) |
| Email | Resend |
| Deployment | Railway |

## Quick start

### Prerequisites

- Node.js 20+
- PostgreSQL database (Supabase recommended)
- YouTube Data API key
- Groq API key (free tier at [console.groq.com](https://console.groq.com))
- Google OAuth credentials

### Setup

```bash
# Install dependencies
npm install

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with your credentials

# Generate Prisma client and push schema
cd backend
npm run db:generate
npm run db:push

# Start development servers
cd ..
npm run dev
```

Frontend runs at `http://localhost:3000`, backend at `http://localhost:4001`.

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

## Project structure

```
kitvas/
├── frontend/          # Next.js 14 app
├── backend/           # Hono + tRPC API
├── shared/            # Shared types
├── docs/              # Documentation
└── package.json       # Root workspace config
```

## Documentation

- [Setup Guide](docs/SETUP.md) — Full setup instructions
- [Batch Pre-Crawl](docs/BATCH_PRE_CRAWL.md) — How the data pipeline works
- [Security](docs/SECURITY.md) — Auth and API security
- [Limitations](docs/LIMITATIONS.md) — Known constraints
- [Deployment](docs/DEPLOYMENT.md) — Production deployment guide

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
