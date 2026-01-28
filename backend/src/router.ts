import { initTRPC } from '@trpc/server';
import type { Context } from './context.js';
import { searchRouter } from './routers/search.js';
import { correctionsRouter } from './routers/corrections.js';
import { opportunitiesRouter } from './routers/opportunities.js';
import { outcomesRouter } from './routers/outcomes.js';

const t = initTRPC.context<Context>().create();

export const appRouter = t.router({
  search: searchRouter,
  corrections: correctionsRouter,
  opportunities: opportunitiesRouter,
  outcomes: outcomesRouter,
});

export type AppRouter = typeof appRouter;
