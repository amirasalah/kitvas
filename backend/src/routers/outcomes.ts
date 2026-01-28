/**
 * Outcomes Router
 *
 * Handles outcome reporting - the calibration loop for opportunity accuracy.
 * Users report how their videos performed after pursuing tracked opportunities.
 * This data calibrates opportunity scoring over time.
 */

import { z } from 'zod';
import { TRPCError, initTRPC } from '@trpc/server';
import type { Context } from '../context.js';

const t = initTRPC.context<Context>().create();

const SubmitOutcomeSchema = z.object({
  trackedOpportunityId: z.string(),
  videoUrl: z.string().url().optional(),
  views7day: z.number().int().min(0).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  didNotPublish: z.boolean().optional(),
});

export const outcomesRouter = t.router({
  /**
   * Submit an outcome for a tracked opportunity
   */
  submit: t.procedure
    .input(SubmitOutcomeSchema)
    .mutation(async ({ input, ctx }) => {
      const { trackedOpportunityId, videoUrl, views7day, rating, didNotPublish } = input;
      const tempUserId = ctx.userId || 'anonymous-' + Date.now();

      try {
        // Verify opportunity exists and belongs to user
        const opportunity = await ctx.prisma.trackedOpportunity.findFirst({
          where: {
            id: trackedOpportunityId,
            userId: tempUserId,
          },
        });

        if (!opportunity) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Tracked opportunity not found',
          });
        }

        // Check if outcome already exists
        const existingOutcome = await ctx.prisma.outcome.findFirst({
          where: { trackedOpportunityId },
        });

        if (existingOutcome) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Outcome already reported for this opportunity',
          });
        }

        // If user didn't publish, update opportunity status to abandoned
        if (didNotPublish) {
          await ctx.prisma.trackedOpportunity.update({
            where: { id: trackedOpportunityId },
            data: { status: 'abandoned' },
          });

          // Create outcome record noting abandonment
          await ctx.prisma.outcome.create({
            data: {
              trackedOpportunityId,
              userId: tempUserId,
              rating: 0, // 0 indicates abandoned
            },
          });

          return {
            success: true,
            message: 'Thanks for the feedback! This helps calibrate our recommendations.',
          };
        }

        // Create the outcome
        const outcome = await ctx.prisma.outcome.create({
          data: {
            trackedOpportunityId,
            userId: tempUserId,
            videoUrl: videoUrl || null,
            views7day: views7day || null,
            rating: rating || null,
          },
        });

        // Update opportunity status to published if not already
        if (opportunity.status !== 'published') {
          await ctx.prisma.trackedOpportunity.update({
            where: { id: trackedOpportunityId },
            data: { status: 'published' },
          });
        }

        return {
          success: true,
          outcomeId: outcome.id,
          message: 'Thanks for reporting! Your outcome helps improve recommendations for everyone.',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('Submit outcome error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit outcome',
        });
      }
    }),

  /**
   * Get user's outcome stats
   */
  getStats: t.procedure.query(async ({ ctx }) => {
    const tempUserId = ctx.userId || 'anonymous-' + Date.now();

    try {
      // Get all user outcomes with opportunity data
      const outcomes = await ctx.prisma.outcome.findMany({
        where: {
          userId: tempUserId,
          rating: { gt: 0 }, // Exclude abandoned (rating=0)
        },
        include: {
          trackedOpportunity: true,
        },
      });

      if (outcomes.length === 0) {
        return {
          totalOutcomes: 0,
          avgRating: null,
          avgViews: null,
          byScore: {
            high: { count: 0, avgRating: null, avgViews: null },
            medium: { count: 0, avgRating: null, avgViews: null },
            low: { count: 0, avgRating: null, avgViews: null },
          },
          recentOutcomes: [],
        };
      }

      // Calculate overall stats
      const totalOutcomes = outcomes.length;
      const ratingsSum = outcomes.reduce((sum, o) => sum + (o.rating || 0), 0);
      const avgRating = ratingsSum / outcomes.filter(o => o.rating).length || null;

      const viewsOutcomes = outcomes.filter(o => o.views7day !== null);
      const avgViews = viewsOutcomes.length > 0
        ? Math.round(viewsOutcomes.reduce((sum, o) => sum + (o.views7day || 0), 0) / viewsOutcomes.length)
        : null;

      // Calculate stats by opportunity score
      const byScore = {
        high: calculateScoreStats(outcomes, 'high'),
        medium: calculateScoreStats(outcomes, 'medium'),
        low: calculateScoreStats(outcomes, 'low'),
      };

      // Get recent outcomes
      const recentOutcomes = outcomes
        .sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime())
        .slice(0, 5)
        .map(o => ({
          id: o.id,
          ingredients: o.trackedOpportunity.ingredients,
          opportunityScore: o.trackedOpportunity.opportunityScore,
          videoUrl: o.videoUrl,
          views7day: o.views7day,
          rating: o.rating,
          reportedAt: o.reportedAt,
        }));

      return {
        totalOutcomes,
        avgRating,
        avgViews,
        byScore,
        recentOutcomes,
      };
    } catch (error) {
      console.error('Get outcome stats error:', error);
      return {
        totalOutcomes: 0,
        avgRating: null,
        avgViews: null,
        byScore: {
          high: { count: 0, avgRating: null, avgViews: null },
          medium: { count: 0, avgRating: null, avgViews: null },
          low: { count: 0, avgRating: null, avgViews: null },
        },
        recentOutcomes: [],
      };
    }
  }),

  /**
   * Get community-wide outcome stats (for opportunity accuracy display)
   */
  getCommunityStats: t.procedure.query(async ({ ctx }) => {
    try {
      // Get all outcomes with opportunity data
      const outcomes = await ctx.prisma.outcome.findMany({
        where: {
          rating: { gt: 0 }, // Exclude abandoned
        },
        include: {
          trackedOpportunity: true,
        },
      });

      const totalOutcomes = outcomes.length;

      // Need at least 10 outcomes to show accuracy
      if (totalOutcomes < 10) {
        return {
          hasEnoughData: false,
          totalOutcomes,
          message: `Need ${10 - totalOutcomes} more outcomes to show accuracy stats.`,
        };
      }

      // Calculate accuracy by score (% with rating >= 4)
      const byScore = {
        high: calculateAccuracy(outcomes, 'high'),
        medium: calculateAccuracy(outcomes, 'medium'),
        low: calculateAccuracy(outcomes, 'low'),
      };

      return {
        hasEnoughData: true,
        totalOutcomes,
        byScore,
      };
    } catch (error) {
      console.error('Get community stats error:', error);
      return {
        hasEnoughData: false,
        totalOutcomes: 0,
        message: 'Unable to load community stats.',
      };
    }
  }),
});

function calculateScoreStats(
  outcomes: Array<{
    rating: number | null;
    views7day: number | null;
    trackedOpportunity: { opportunityScore: string };
  }>,
  score: string
) {
  const filtered = outcomes.filter(o => o.trackedOpportunity.opportunityScore === score);

  if (filtered.length === 0) {
    return { count: 0, avgRating: null, avgViews: null };
  }

  const withRating = filtered.filter(o => o.rating !== null);
  const avgRating = withRating.length > 0
    ? withRating.reduce((sum, o) => sum + (o.rating || 0), 0) / withRating.length
    : null;

  const withViews = filtered.filter(o => o.views7day !== null);
  const avgViews = withViews.length > 0
    ? Math.round(withViews.reduce((sum, o) => sum + (o.views7day || 0), 0) / withViews.length)
    : null;

  return {
    count: filtered.length,
    avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    avgViews,
  };
}

function calculateAccuracy(
  outcomes: Array<{
    rating: number | null;
    trackedOpportunity: { opportunityScore: string };
  }>,
  score: string
) {
  const filtered = outcomes.filter(
    o => o.trackedOpportunity.opportunityScore === score && o.rating !== null
  );

  if (filtered.length < 5) {
    return { count: filtered.length, accuracy: null, needMore: 5 - filtered.length };
  }

  // Accuracy = % of outcomes with rating >= 4 (considered "successful")
  const successful = filtered.filter(o => (o.rating || 0) >= 4).length;
  const accuracy = Math.round((successful / filtered.length) * 100);

  return {
    count: filtered.length,
    accuracy,
    needMore: 0,
  };
}
