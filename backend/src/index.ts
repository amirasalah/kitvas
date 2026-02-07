import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './router.js';
import { createContext } from './context.js';
import { startExtractionWorker } from './lib/extraction-queue.js';
import { initExtractor } from './lib/ingredient-extractor.js';
import { broadcaster } from './lib/sse-broadcast.js';
import { queryHotIngredients } from './lib/hot-ingredients-query.js';
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
  allowHeaders: ['Content-Type', 'trpc-batch-mode', 'X-Internal-Secret'],
  exposeHeaders: ['Content-Length'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// SSE endpoint for real-time trending ingredient updates
app.get('/sse/trends', (c) => {
  return streamSSE(c, async (stream) => {
    const id = crypto.randomUUID();
    broadcaster.addConnection(id, stream);

    await stream.writeSSE({ event: 'connected', data: JSON.stringify({ id }) });

    // Keepalive every 30s to prevent proxy timeouts
    const heartbeat = setInterval(async () => {
      try {
        await stream.writeSSE({ event: 'heartbeat', data: '' });
      } catch {
        clearInterval(heartbeat);
      }
    }, 30_000);

    stream.onAbort(() => {
      clearInterval(heartbeat);
      broadcaster.removeConnection(id);
    });

    // Keep stream open until client disconnects
    await new Promise(() => {});
  });
});

// Internal endpoint: triggers SSE broadcast after cron job completes
app.post('/internal/broadcast-trends', async (c) => {
  const secret = c.req.header('x-internal-secret');
  if (!secret || secret !== process.env.INTERNAL_BROADCAST_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const [today, week, month] = await Promise.all([
    queryHotIngredients(prisma, 'today', 10),
    queryHotIngredients(prisma, 'week', 10),
    queryHotIngredients(prisma, 'month', 10),
  ]);

  await broadcaster.broadcast('trends-update', { today, week, month });
  return c.json({ ok: true, connections: broadcaster.getConnectionCount() });
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
