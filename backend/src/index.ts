import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './router.js';
import { createContext } from './context.js';
import { startExtractionWorker } from './lib/extraction-queue.js';
import { initExtractor } from './lib/ingredient-extractor.js';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma for extraction worker
const prisma = new PrismaClient();

// Initialize extractor with feedback from corrections (ML feedback loop)
initExtractor(prisma);

const app = new Hono();

// Enable CORS for frontend
app.use('/*', cors({
  origin: (origin) => {
    // Allow localhost on any port for development
    if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return origin || '*';
    }
    return null;
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'trpc-batch-mode'],
  exposeHeaders: ['Content-Length'],
  credentials: true,
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

const port = Number(process.env.PORT) || 4001;

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`🚀 Backend server running on http://localhost:${info.port}`);

  // Start background extraction worker
  startExtractionWorker(prisma);
});
