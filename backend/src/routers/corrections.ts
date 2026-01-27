/**
 * Corrections Router
 *
 * Handles ingredient corrections - the core moat feature.
 * Users can mark ingredients as wrong, right, or suggest additions.
 * This data becomes training data for improving extraction.
 */

import { z } from 'zod';
import { TRPCError, initTRPC } from '@trpc/server';
import type { Context } from '../context.js';

const t = initTRPC.context<Context>().create();

const SubmitCorrectionSchema = z.object({
  videoId: z.string(),
  ingredientId: z.string(),
  action: z.enum(['wrong', 'right', 'add', 'rename']),
  suggestedName: z.string().optional(),
});

const AddIngredientSchema = z.object({
  videoId: z.string(),
  ingredientName: z.string().min(1).max(100),
});

export const correctionsRouter = t.router({
  /**
   * Submit a correction for an ingredient on a video
   */
  submit: t.procedure
    .input(SubmitCorrectionSchema)
    .mutation(async ({ input, ctx }) => {
      const { videoId, ingredientId, action, suggestedName } = input;

      // For now, generate a temporary user ID if not authenticated
      // This will be replaced with real auth in Week 8
      const tempUserId = ctx.userId || 'anonymous-' + Date.now();

      try {
        // Verify video exists
        const video = await ctx.prisma.video.findUnique({
          where: { id: videoId },
        });

        if (!video) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Video not found',
          });
        }

        // Verify ingredient exists
        const ingredient = await ctx.prisma.ingredient.findUnique({
          where: { id: ingredientId },
        });

        if (!ingredient) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Ingredient not found',
          });
        }

        // Ensure user exists (create temporary user if needed)
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

        // Create the correction
        const correction = await ctx.prisma.correction.create({
          data: {
            userId: user.id,
            videoId,
            ingredientId,
            action,
            suggestedName: suggestedName || null,
          },
        });

        // Update correction count on user
        await ctx.prisma.user.update({
          where: { id: user.id },
          data: {
            correctionsCount: { increment: 1 },
          },
        });

        // Update correction count on video ingredient
        await ctx.prisma.videoIngredient.updateMany({
          where: {
            videoId,
            ingredientId,
          },
          data: {
            correctionsCount: { increment: 1 },
          },
        });

        // If action is 'wrong', decrease confidence
        // If action is 'right', increase confidence
        if (action === 'wrong' || action === 'right') {
          const confidenceChange = action === 'wrong' ? -0.1 : 0.05;

          const currentVI = await ctx.prisma.videoIngredient.findUnique({
            where: {
              videoId_ingredientId: { videoId, ingredientId },
            },
          });

          if (currentVI) {
            const newConfidence = Math.max(0, Math.min(1, currentVI.confidence + confidenceChange));
            await ctx.prisma.videoIngredient.update({
              where: {
                videoId_ingredientId: { videoId, ingredientId },
              },
              data: {
                confidence: newConfidence,
              },
            });
          }
        }

        // Calculate impact (how many videos this affects)
        const impactCount = await ctx.prisma.videoIngredient.count({
          where: { ingredientId },
        });

        return {
          success: true,
          correctionId: correction.id,
          impactCount,
          message: `Thanks! Your correction affects ${impactCount} video${impactCount === 1 ? '' : 's'}.`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('Correction error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit correction',
        });
      }
    }),

  /**
   * Add a missing ingredient to a video
   */
  addIngredient: t.procedure
    .input(AddIngredientSchema)
    .mutation(async ({ input, ctx }) => {
      const { videoId, ingredientName } = input;
      const normalizedName = ingredientName.toLowerCase().trim();

      // For now, generate a temporary user ID
      const tempUserId = ctx.userId || 'anonymous-' + Date.now();

      try {
        // Verify video exists
        const video = await ctx.prisma.video.findUnique({
          where: { id: videoId },
        });

        if (!video) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Video not found',
          });
        }

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

        // Find or create the ingredient
        let ingredient = await ctx.prisma.ingredient.findUnique({
          where: { name: normalizedName },
        });

        if (!ingredient) {
          ingredient = await ctx.prisma.ingredient.create({
            data: {
              name: normalizedName,
              synonyms: [],
            },
          });
        }

        // Check if this ingredient is already linked to this video
        const existingLink = await ctx.prisma.videoIngredient.findUnique({
          where: {
            videoId_ingredientId: {
              videoId,
              ingredientId: ingredient.id,
            },
          },
        });

        if (existingLink) {
          return {
            success: true,
            message: 'This ingredient is already associated with this video.',
            alreadyExists: true,
          };
        }

        // Create the video-ingredient link
        await ctx.prisma.videoIngredient.create({
          data: {
            videoId,
            ingredientId: ingredient.id,
            confidence: 0.7, // User-added ingredients get moderate confidence
            source: 'user_correction',
          },
        });

        // Create a correction record for tracking
        await ctx.prisma.correction.create({
          data: {
            userId: user.id,
            videoId,
            ingredientId: ingredient.id,
            action: 'add',
          },
        });

        // Update user correction count
        await ctx.prisma.user.update({
          where: { id: user.id },
          data: {
            correctionsCount: { increment: 1 },
          },
        });

        return {
          success: true,
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          message: `Added "${ingredient.name}" to this video.`,
          alreadyExists: false,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('Add ingredient error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add ingredient',
        });
      }
    }),

  /**
   * Get user's correction stats
   */
  getStats: t.procedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    if (!userId) {
      return {
        totalCorrections: 0,
        totalImpact: 0,
        recentCorrections: [],
      };
    }

    try {
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { correctionsCount: true },
      });

      // Get total impact (unique videos affected)
      const corrections = await ctx.prisma.correction.findMany({
        where: { userId },
        select: { videoId: true },
        distinct: ['videoId'],
      });

      // Get recent corrections
      const recentCorrections = await ctx.prisma.correction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          video: { select: { title: true } },
          ingredient: { select: { name: true } },
        },
      });

      return {
        totalCorrections: user?.correctionsCount || 0,
        totalImpact: corrections.length,
        recentCorrections: recentCorrections.map((c) => ({
          id: c.id,
          action: c.action,
          videoTitle: c.video.title,
          ingredientName: c.ingredient.name,
          createdAt: c.createdAt,
        })),
      };
    } catch (error) {
      console.error('Get stats error:', error);
      return {
        totalCorrections: 0,
        totalImpact: 0,
        recentCorrections: [],
      };
    }
  }),
});
