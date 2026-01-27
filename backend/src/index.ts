import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './router.js';
import { createContext } from './context.js';
import { startExtractionWorker } from './lib/extraction-queue.js';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma for extraction worker
const prisma = new PrismaClient();

const app = new Hono();

// Enable CORS for frontend
app.use('/*', cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// tRPC endpoint using fetch adapter (compatible with tRPC v11)
app.use('/trpc/*', async (c) => {
  const response = await fetchRequestHandler({
    endpoint: '/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext: () => createContext(undefined, c),
  });
  return response;
});

const port = Number(process.env.PORT) || 3001;

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`🚀 Backend server running on http://localhost:${info.port}`);

  // Start background extraction worker
  startExtractionWorker(prisma);
});
