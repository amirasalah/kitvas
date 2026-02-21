import { t, protectedProcedure } from '../trpc.js';

export const alertsRouter = t.router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const sub = await ctx.prisma.alertSubscription.findUnique({
      where: { userId: ctx.userId },
    });
    return { enabled: sub?.enabled ?? false };
  }),

  subscribe: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.alertSubscription.upsert({
      where: { userId: ctx.userId },
      create: { userId: ctx.userId, enabled: true },
      update: { enabled: true },
    });
    return { enabled: true };
  }),

  unsubscribe: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.alertSubscription.upsert({
      where: { userId: ctx.userId },
      create: { userId: ctx.userId, enabled: false },
      update: { enabled: false },
    });
    return { enabled: false };
  }),
});
