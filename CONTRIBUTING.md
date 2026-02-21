# Contributing to Kitvas

Thanks for your interest in contributing to Kitvas!

## Development setup

1. Fork and clone the repo
2. Follow the [Setup Guide](docs/SETUP.md)
3. Create a branch for your changes

```bash
git checkout -b feature/your-feature
```

## Development workflow

```bash
# Start dev servers
npm run dev

# Type-check
npm run type-check

# Run Prisma Studio (database browser)
cd backend && npm run db:studio
```

## Project structure

- `frontend/` — Next.js 14 app with App Router
- `backend/` — Hono server with tRPC routers
- `shared/` — Shared TypeScript types
- `docs/` — Documentation

## Pull requests

1. Keep PRs focused — one feature or fix per PR
2. Ensure `npm run type-check` passes in both frontend and backend
3. Update documentation if your change affects setup or behavior
4. Write a clear PR description explaining what and why

## Reporting issues

Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Environment details (Node version, OS)

## Code style

- TypeScript throughout
- Follow existing patterns in the codebase
- Keep imports organized (external, then internal)
- Use Prisma for all database operations
