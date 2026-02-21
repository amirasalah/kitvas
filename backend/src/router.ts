import { t } from './trpc.js';
import { searchRouter } from './routers/search.js';
import { analyticsRouter } from './routers/analytics.js';
import { gapsRouter } from './routers/gaps.js';
import { alertsRouter } from './routers/alerts.js';

export const appRouter = t.router({
  search: searchRouter,
  analytics: analyticsRouter,
  gaps: gapsRouter,
  alerts: alertsRouter,
});

export type AppRouter = typeof appRouter;
