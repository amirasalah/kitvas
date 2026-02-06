import { t } from './trpc.js';
import { searchRouter } from './routers/search.js';
import { correctionsRouter } from './routers/corrections.js';
import { opportunitiesRouter } from './routers/opportunities.js';
import { outcomesRouter } from './routers/outcomes.js';
import { adminRouter } from './routers/admin.js';
import { analyticsRouter } from './routers/analytics.js';
import { gapsRouter } from './routers/gaps.js';

export const appRouter = t.router({
  search: searchRouter,
  corrections: correctionsRouter,
  opportunities: opportunitiesRouter,
  outcomes: outcomesRouter,
  admin: adminRouter,
  analytics: analyticsRouter,
  gaps: gapsRouter,
});

export type AppRouter = typeof appRouter;
