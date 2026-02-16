import { t } from './trpc.js';
import { searchRouter } from './routers/search.js';
import { opportunitiesRouter } from './routers/opportunities.js';
import { outcomesRouter } from './routers/outcomes.js';
import { analyticsRouter } from './routers/analytics.js';
import { gapsRouter } from './routers/gaps.js';

export const appRouter = t.router({
  search: searchRouter,
  opportunities: opportunitiesRouter,
  outcomes: outcomesRouter,
  analytics: analyticsRouter,
  gaps: gapsRouter,
});

export type AppRouter = typeof appRouter;
