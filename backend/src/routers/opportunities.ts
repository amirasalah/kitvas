/**
 * Opportunities Router
 *
 * Handles opportunity tracking - a core moat feature.
 * Users can track opportunities they're considering, update status,
 * and later report outcomes. This creates the calibration loop.
 */

import { z } from 'zod';
import { TRPCError, initTRPC } from '@trpc/server';
import type { Context } from '../context.js';
import { getStableAnonymousId } from '../lib/anonymous-user.js';

const t = initTRPC.context<Context>().create();

const TrackOpportunitySchema = z.object({
  ingredients: z.array(z.string()).min(1),
  opportunityScore: z.enum(['high', 'medium', 'low']),
  opportunityType: z.string().optional(),
  title: z.string().optional(),
});

const UpdateStatusSchema = z.object({
  opportunityId: z.string(),
  status: z.enum(['researching', 'filming', 'published', 'abandoned']),
});

const FREE_TIER_LIMIT = 5;

export const opportunitiesRouter = t.router({
  /**
   * Track a new opportunity
   */
  track: t.procedure
    .input(TrackOpportunitySchema)
    .mutation(async ({ input, ctx }) => {
      const { ingredients, opportunityScore, opportunityType, title } = input;

      // For now, generate a temporary user ID if not authenticated
      const tempUserId = getStableAnonymousId(ctx);

      try {
        // Ensure user exists
        let user = await ctx.prisma.user.findUnique({
          where: { id: tempUserId },
        });

        if (!user) {
          user = await ctx.prisma.user.create({
            data: {
              id: tempUserId,
              email: `${tempUserId}@temp.kitvas.com`,
            },
          });
        }

        // Check free tier limit (5 active opportunities)
        if (user.subscription === 'free') {
          const activeCount = await ctx.prisma.trackedOpportunity.count({
            where: {
              userId: user.id,
              status: { in: ['researching', 'filming'] },
            },
          });

          if (activeCount >= FREE_TIER_LIMIT) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: `Free tier limit: ${FREE_TIER_LIMIT} active opportunities. Upgrade to Pro for unlimited tracking.`,
            });
          }
        }

        // Check if user already tracks this exact ingredient combination
        const normalizedIngredients = ingredients.map(i => i.toLowerCase().trim()).sort();
        const existing = await ctx.prisma.trackedOpportunity.findFirst({
          where: {
            userId: user.id,
            ingredients: { equals: normalizedIngredients },
            status: { in: ['researching', 'filming'] },
          },
        });

        if (existing) {
          return {
            success: true,
            opportunityId: existing.id,
            message: 'You are already tracking this opportunity.',
            alreadyTracked: true,
          };
        }

        // Create the tracked opportunity
        const opportunity = await ctx.prisma.trackedOpportunity.create({
          data: {
            userId: user.id,
            ingredients: normalizedIngredients,
            status: 'researching',
            opportunityScore,
          },
        });

        return {
          success: true,
          opportunityId: opportunity.id,
          message: 'Opportunity tracked! Find it in My Opportunities.',
          alreadyTracked: false,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('Track opportunity error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to track opportunity',
        });
      }
    }),

  /**
   * Update opportunity status
   */
  updateStatus: t.procedure
    .input(UpdateStatusSchema)
    .mutation(async ({ input, ctx }) => {
      const { opportunityId, status } = input;
      const tempUserId = getStableAnonymousId(ctx);

      try {
        // Verify opportunity exists and belongs to user
        const opportunity = await ctx.prisma.trackedOpportunity.findFirst({
          where: {
            id: opportunityId,
            userId: tempUserId,
          },
        });

        if (!opportunity) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Opportunity not found',
          });
        }

        // Update status
        const updated = await ctx.prisma.trackedOpportunity.update({
          where: { id: opportunityId },
          data: { status },
        });

        return {
          success: true,
          opportunityId: updated.id,
          status: updated.status,
          message: status === 'published'
            ? 'Congrats on publishing! Report your outcome in 30 days.'
            : `Status updated to ${status}.`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('Update status error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update status',
        });
      }
    }),

  /**
   * List user's tracked opportunities
   */
  list: t.procedure.query(async ({ ctx }) => {
    const tempUserId = getStableAnonymousId(ctx);

    try {
      // Get user's tracked opportunities
      const opportunities = await ctx.prisma.trackedOpportunity.findMany({
        where: { userId: tempUserId },
        orderBy: { trackedAt: 'desc' },
        include: {
          outcomes: {
            orderBy: { reportedAt: 'desc' },
            take: 1,
          },
        },
      });

      // Get user subscription for limit info
      const user = await ctx.prisma.user.findUnique({
        where: { id: tempUserId },
        select: { subscription: true },
      });

      const activeCount = opportunities.filter(
        o => o.status === 'researching' || o.status === 'filming'
      ).length;

      return {
        opportunities: opportunities.map(o => ({
          id: o.id,
          ingredients: o.ingredients,
          status: o.status,
          opportunityScore: o.opportunityScore,
          trackedAt: o.trackedAt,
          hasOutcome: o.outcomes.length > 0,
          latestOutcome: o.outcomes[0] || null,
        })),
        activeCount,
        limit: user?.subscription === 'pro' ? null : FREE_TIER_LIMIT,
        isAtLimit: user?.subscription === 'free' && activeCount >= FREE_TIER_LIMIT,
      };
    } catch (error) {
      console.error('List opportunities error:', error);
      return {
        opportunities: [],
        activeCount: 0,
        limit: FREE_TIER_LIMIT,
        isAtLimit: false,
      };
    }
  }),

  /**
   * Delete/untrack an opportunity
   */
  delete: t.procedure
    .input(z.object({ opportunityId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { opportunityId } = input;
      const tempUserId = getStableAnonymousId(ctx);

      try {
        // Verify opportunity exists and belongs to user
        const opportunity = await ctx.prisma.trackedOpportunity.findFirst({
          where: {
            id: opportunityId,
            userId: tempUserId,
          },
        });

        if (!opportunity) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Opportunity not found',
          });
        }

        await ctx.prisma.trackedOpportunity.delete({
          where: { id: opportunityId },
        });

        return {
          success: true,
          message: 'Opportunity removed from tracking.',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('Delete opportunity error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete opportunity',
        });
      }
    }),

  /**
   * Get opportunities that need outcome reporting (published 30+ days ago)
   */
  getPendingOutcomes: t.procedure.query(async ({ ctx }) => {
    const tempUserId = getStableAnonymousId(ctx);

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find published opportunities without outcomes
      const pending = await ctx.prisma.trackedOpportunity.findMany({
        where: {
          userId: tempUserId,
          status: 'published',
          outcomes: { none: {} },
          trackedAt: { lte: thirtyDaysAgo },
        },
        orderBy: { trackedAt: 'asc' },
      });

      return {
        pendingOutcomes: pending.map(o => ({
          id: o.id,
          ingredients: o.ingredients,
          opportunityScore: o.opportunityScore,
          trackedAt: o.trackedAt,
          daysSincePublished: Math.floor(
            (Date.now() - o.trackedAt.getTime()) / (1000 * 60 * 60 * 24)
          ),
        })),
        count: pending.length,
      };
    } catch (error) {
      console.error('Get pending outcomes error:', error);
      return {
        pendingOutcomes: [],
        count: 0,
      };
    }
  }),
});
