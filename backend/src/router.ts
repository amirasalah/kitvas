import { initTRPC } from '@trpc/server';
import { Context } from './context';
import { searchRouter } from './routers/search';

const t = initTRPC.context<Context>().create({
  // tRPC v11 options
});

export const appRouter = t.router({
  search: searchRouter(t),
});

export type AppRouter = typeof appRouter;
