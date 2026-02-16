/**
 * Shared tRPC instance and procedure helpers.
 * All routers import from here to avoid circular dependencies.
 */

import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context.js';

export const t = initTRPC.context<Context>().create();

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be signed in to perform this action.',
    });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});
