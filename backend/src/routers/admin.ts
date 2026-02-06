/**
 * Admin Router
 *
 * Handles the training data labeling workflow:
 * - Browse videos for labeling
 * - Add/remove/edit ingredients on videos
 * - Mark videos as labeled (verified)
 * - Export labeled dataset (JSON/CSV)
 * - Dataset statistics and progress tracking
 *
 * Week 4: Training Data Collection
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { t, adminProcedure } from '../trpc.js';

export const adminRouter = t.router({
  /**
   * Get paginated videos for labeling
   * Supports filtering by labeled/unlabeled status
   */
  getVideos: adminProcedure
    .input(
      z.object({
        cursor: z.string().optional(), // for pagination
        limit: z.number().min(1).max(100).default(20),
        filter: z.enum(['all', 'labeled', 'unlabeled']).default('unlabeled'),
        search: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { cursor, limit, filter, search } = input;

      const where: any = {};

      // Only show videos that have been extracted (have ingredients)
      where.extractedAt = { not: null };

      if (filter === 'labeled') {
        where.labeledAt = { not: null };
      } else if (filter === 'unlabeled') {
        where.labeledAt = null;
      }

      if (search) {
        where.title = { contains: search, mode: 'insensitive' };
      }

      const videos = await ctx.prisma.video.findMany({
        where,
        take: limit + 1, // fetch one extra to check if there's a next page
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { extractedAt: 'desc' },
        include: {
          videoIngredients: {
            include: {
              ingredient: true,
            },
            orderBy: { confidence: 'desc' },
          },
          _count: {
            select: { corrections: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (videos.length > limit) {
        const nextItem = videos.pop();
        nextCursor = nextItem?.id;
      }

      return {
        videos: videos.map((v) => ({
          id: v.id,
          youtubeId: v.youtubeId,
          title: v.title,
          description: v.description,
          thumbnailUrl: v.thumbnailUrl,
          publishedAt: v.publishedAt,
          views: v.views,
          extractedAt: v.extractedAt,
          labeledAt: v.labeledAt,
          labeledBy: v.labeledBy,
          correctionsCount: v._count.corrections,
          ingredients: v.videoIngredients.map((vi) => ({
            id: vi.ingredient.id,
            name: vi.ingredient.name,
            confidence: vi.confidence,
            source: vi.source,
            correctionsCount: vi.correctionsCount,
          })),
        })),
        nextCursor,
      };
    }),

  /**
   * Get a single video with full details for labeling
   */
  getVideo: adminProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ input, ctx }) => {
      const video = await ctx.prisma.video.findUnique({
        where: { id: input.videoId },
        include: {
          videoIngredients: {
            include: {
              ingredient: true,
            },
            orderBy: { confidence: 'desc' },
          },
          corrections: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              ingredient: { select: { name: true } },
            },
          },
        },
      });

      if (!video) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Video not found' });
      }

      return {
        id: video.id,
        youtubeId: video.youtubeId,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        publishedAt: video.publishedAt,
        views: video.views,
        extractedAt: video.extractedAt,
        labeledAt: video.labeledAt,
        labeledBy: video.labeledBy,
        ingredients: video.videoIngredients.map((vi) => ({
          id: vi.ingredient.id,
          name: vi.ingredient.name,
          confidence: vi.confidence,
          source: vi.source,
          correctionsCount: vi.correctionsCount,
        })),
        recentCorrections: video.corrections.map((c) => ({
          id: c.id,
          action: c.action,
          ingredientName: c.ingredient.name,
          suggestedName: c.suggestedName,
          createdAt: c.createdAt,
        })),
      };
    }),

  /**
   * Mark a video as labeled (verified by admin)
   */
  markLabeled: adminProcedure
    .input(
      z.object({
        videoId: z.string(),
        labeledBy: z.string().default('admin'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const video = await ctx.prisma.video.findUnique({
        where: { id: input.videoId },
      });

      if (!video) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Video not found' });
      }

      await ctx.prisma.video.update({
        where: { id: input.videoId },
        data: {
          labeledAt: new Date(),
          labeledBy: input.labeledBy,
        },
      });

      return { success: true, message: 'Video marked as labeled' };
    }),

  /**
   * Unmark a video (revert labeling)
   */
  unmarkLabeled: adminProcedure
    .input(z.object({ videoId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.video.update({
        where: { id: input.videoId },
        data: {
          labeledAt: null,
          labeledBy: null,
        },
      });

      return { success: true, message: 'Video unmarked' };
    }),

  /**
   * Add an ingredient to a video (admin labeling)
   */
  addIngredient: adminProcedure
    .input(
      z.object({
        videoId: z.string(),
        ingredientName: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const normalizedName = input.ingredientName.toLowerCase().trim();

      // Find or create ingredient
      let ingredient = await ctx.prisma.ingredient.findUnique({
        where: { name: normalizedName },
      });

      if (!ingredient) {
        ingredient = await ctx.prisma.ingredient.create({
          data: { name: normalizedName },
        });
      }

      // Check if already linked
      const existing = await ctx.prisma.videoIngredient.findUnique({
        where: {
          videoId_ingredientId: {
            videoId: input.videoId,
            ingredientId: ingredient.id,
          },
        },
      });

      if (existing) {
        return {
          success: true,
          alreadyExists: true,
          ingredient: { id: ingredient.id, name: ingredient.name },
          message: `"${ingredient.name}" is already linked to this video.`,
        };
      }

      await ctx.prisma.videoIngredient.create({
        data: {
          videoId: input.videoId,
          ingredientId: ingredient.id,
          confidence: 1.0, // Admin-added = full confidence
          source: 'admin_label',
        },
      });

      return {
        success: true,
        alreadyExists: false,
        ingredient: { id: ingredient.id, name: ingredient.name },
        message: `Added "${ingredient.name}"`,
      };
    }),

  /**
   * Remove an ingredient from a video (admin labeling)
   */
  removeIngredient: adminProcedure
    .input(
      z.object({
        videoId: z.string(),
        ingredientId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.videoIngredient.deleteMany({
        where: {
          videoId: input.videoId,
          ingredientId: input.ingredientId,
        },
      });

      return { success: true, message: 'Ingredient removed' };
    }),

  /**
   * Rename an ingredient on a video
   */
  renameIngredient: adminProcedure
    .input(
      z.object({
        videoId: z.string(),
        ingredientId: z.string(),
        newName: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const normalizedName = input.newName.toLowerCase().trim();

      // Find or create the new ingredient
      let newIngredient = await ctx.prisma.ingredient.findUnique({
        where: { name: normalizedName },
      });

      if (!newIngredient) {
        newIngredient = await ctx.prisma.ingredient.create({
          data: { name: normalizedName },
        });
      }

      // Remove old link
      await ctx.prisma.videoIngredient.deleteMany({
        where: {
          videoId: input.videoId,
          ingredientId: input.ingredientId,
        },
      });

      // Create new link (check if it already exists first)
      const existing = await ctx.prisma.videoIngredient.findUnique({
        where: {
          videoId_ingredientId: {
            videoId: input.videoId,
            ingredientId: newIngredient.id,
          },
        },
      });

      if (!existing) {
        await ctx.prisma.videoIngredient.create({
          data: {
            videoId: input.videoId,
            ingredientId: newIngredient.id,
            confidence: 1.0,
            source: 'admin_label',
          },
        });
      }

      return {
        success: true,
        ingredient: { id: newIngredient.id, name: newIngredient.name },
        message: `Renamed to "${newIngredient.name}"`,
      };
    }),

  /**
   * Set confidence for a specific ingredient on a video
   */
  setConfidence: adminProcedure
    .input(
      z.object({
        videoId: z.string(),
        ingredientId: z.string(),
        confidence: z.number().min(0).max(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.videoIngredient.update({
        where: {
          videoId_ingredientId: {
            videoId: input.videoId,
            ingredientId: input.ingredientId,
          },
        },
        data: { confidence: input.confidence },
      });

      return { success: true };
    }),

  /**
   * Get labeling progress stats
   */
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [totalVideos, labeledVideos, totalIngredients, totalCorrections] =
      await Promise.all([
        ctx.prisma.video.count({ where: { extractedAt: { not: null } } }),
        ctx.prisma.video.count({ where: { labeledAt: { not: null } } }),
        ctx.prisma.ingredient.count(),
        ctx.prisma.correction.count(),
      ]);

    // Get ingredient distribution (top 20 most common)
    const topIngredients = await ctx.prisma.videoIngredient.groupBy({
      by: ['ingredientId'],
      _count: { videoId: true },
      orderBy: { _count: { videoId: 'desc' } },
      take: 20,
    });

    const ingredientIds = topIngredients.map((ti) => ti.ingredientId);
    const ingredientNames = await ctx.prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(ingredientNames.map((i) => [i.id, i.name]));

    return {
      totalVideos,
      labeledVideos,
      unlabeledVideos: totalVideos - labeledVideos,
      labelingProgress: totalVideos > 0 ? labeledVideos / totalVideos : 0,
      totalIngredients,
      totalCorrections,
      topIngredients: topIngredients.map((ti) => ({
        name: nameMap.get(ti.ingredientId) || 'unknown',
        count: ti._count.videoId,
      })),
    };
  }),

  /**
   * Export labeled dataset as JSON
   */
  exportJSON: adminProcedure
    .input(
      z.object({
        filter: z.enum(['labeled', 'all']).default('labeled'),
      })
    )
    .query(async ({ input, ctx }) => {
      const where: any = { extractedAt: { not: null } };
      if (input.filter === 'labeled') {
        where.labeledAt = { not: null };
      }

      const videos = await ctx.prisma.video.findMany({
        where,
        include: {
          videoIngredients: {
            include: { ingredient: true },
            orderBy: { confidence: 'desc' },
          },
        },
        orderBy: { labeledAt: 'desc' },
      });

      return {
        exportedAt: new Date().toISOString(),
        totalVideos: videos.length,
        data: videos.map((v) => ({
          youtubeId: v.youtubeId,
          title: v.title,
          description: v.description,
          labeledAt: v.labeledAt?.toISOString() || null,
          labeledBy: v.labeledBy,
          ingredients: v.videoIngredients.map((vi) => ({
            name: vi.ingredient.name,
            confidence: vi.confidence,
            source: vi.source,
          })),
        })),
      };
    }),

  /**
   * Export labeled dataset as CSV (returns CSV string)
   */
  exportCSV: adminProcedure
    .input(
      z.object({
        filter: z.enum(['labeled', 'all']).default('labeled'),
      })
    )
    .query(async ({ input, ctx }) => {
      const where: any = { extractedAt: { not: null } };
      if (input.filter === 'labeled') {
        where.labeledAt = { not: null };
      }

      const videos = await ctx.prisma.video.findMany({
        where,
        include: {
          videoIngredients: {
            include: { ingredient: true },
            orderBy: { confidence: 'desc' },
          },
        },
        orderBy: { labeledAt: 'desc' },
      });

      // CSV format: youtubeId, title, ingredients (pipe-separated), confidences, sources, labeledAt
      const header =
        'youtube_id,title,ingredients,confidences,sources,labeled_at,labeled_by';
      const rows = videos.map((v) => {
        const ingredients = v.videoIngredients
          .map((vi) => vi.ingredient.name)
          .join('|');
        const confidences = v.videoIngredients
          .map((vi) => vi.confidence.toFixed(2))
          .join('|');
        const sources = v.videoIngredients.map((vi) => vi.source).join('|');
        // Escape CSV fields
        const escapedTitle = `"${v.title.replace(/"/g, '""')}"`;
        return `${v.youtubeId},${escapedTitle},${ingredients},${confidences},${sources},${v.labeledAt?.toISOString() || ''},${v.labeledBy || ''}`;
      });

      return {
        csv: [header, ...rows].join('\n'),
        totalVideos: videos.length,
      };
    }),

  /**
   * Export dataset with train/validation/test splits
   */
  exportSplit: adminProcedure
    .input(
      z.object({
        trainRatio: z.number().min(0.1).max(0.9).default(0.7),
        validationRatio: z.number().min(0.05).max(0.3).default(0.15),
        // test ratio = 1 - train - validation
        seed: z.number().optional(), // for reproducible splits
      })
    )
    .query(async ({ input, ctx }) => {
      const { trainRatio, validationRatio } = input;
      const testRatio = 1 - trainRatio - validationRatio;

      if (testRatio < 0.05) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Test ratio too small. Adjust train/validation ratios so test is at least 5%.',
        });
      }

      const videos = await ctx.prisma.video.findMany({
        where: {
          labeledAt: { not: null },
          extractedAt: { not: null },
        },
        include: {
          videoIngredients: {
            include: { ingredient: true },
            orderBy: { confidence: 'desc' },
          },
        },
      });

      if (videos.length === 0) {
        return {
          train: [],
          validation: [],
          test: [],
          stats: {
            total: 0,
            trainCount: 0,
            validationCount: 0,
            testCount: 0,
          },
        };
      }

      // Shuffle with optional seed
      const shuffled = [...videos];
      const seed = input.seed ?? Date.now();
      // Simple seeded shuffle (Fisher-Yates with seeded random)
      let rng = seed;
      const seededRandom = () => {
        rng = (rng * 1664525 + 1013904223) % 4294967296;
        return rng / 4294967296;
      };
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const trainEnd = Math.floor(shuffled.length * trainRatio);
      const validationEnd = trainEnd + Math.floor(shuffled.length * validationRatio);

      const format = (v: (typeof videos)[0]) => ({
        youtubeId: v.youtubeId,
        title: v.title,
        description: v.description,
        ingredients: v.videoIngredients.map((vi) => ({
          name: vi.ingredient.name,
          confidence: vi.confidence,
          source: vi.source,
        })),
      });

      const train = shuffled.slice(0, trainEnd).map(format);
      const validation = shuffled.slice(trainEnd, validationEnd).map(format);
      const test = shuffled.slice(validationEnd).map(format);

      return {
        train,
        validation,
        test,
        stats: {
          total: shuffled.length,
          trainCount: train.length,
          validationCount: validation.length,
          testCount: test.length,
          trainRatio: +(train.length / shuffled.length).toFixed(3),
          validationRatio: +(validation.length / shuffled.length).toFixed(3),
          testRatio: +(test.length / shuffled.length).toFixed(3),
        },
      };
    }),
});
