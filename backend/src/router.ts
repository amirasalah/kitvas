import { initTRPC } from '@trpc/server';
import type { Context } from './context.js';
import { searchRouter } from './routers/search.js';
import { correctionsRouter } from './routers/corrections.js';

const t = initTRPC.context<Context>().create();

export const appRouter = t.router({
  search: searchRouter,
  corrections: correctionsRouter,
});

export type AppRouter = typeof appRouter;
