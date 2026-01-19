import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { Context } from '../context';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

const SearchInputSchema = z.object({
  ingredients: z.array(z.string()).min(1).max(10),
  tags: z.array(z.string()).optional(),
});

type TRPCInstance = ReturnType<typeof import('@trpc/server').initTRPC.context<Context>['create']>;

export function searchRouter(t: TRPCInstance) {
  return t.router({
    search: t.procedure
      .input(SearchInputSchema)
      .query(async (opts) => {
        const { input, ctx } = opts;
        const { ingredients, tags } = input;

        try {
          // Normalize ingredient names (lowercase, trim)
          const normalizedIngredients = ingredients.map((ing: string) => 
            ing.toLowerCase().trim()
          );

          // Search for videos with matching ingredients
          const videos = await ctx.prisma.video.findMany({
            where: {
              videoIngredients: {
                some: {
                  ingredient: {
                    name: {
                      in: normalizedIngredients,
                    },
                  },
                },
              },
            },
            include: {
              videoIngredients: {
                include: {
                  ingredient: true,
                },
              },
            },
            take: 50, // Limit results
            orderBy: {
              publishedAt: 'desc',
            },
          });

          // Calculate relevance scores
          const resultsWithScores = videos.map((video: any) => {
            const matchingIngredients = video.videoIngredients.filter((vi: any) =>
              normalizedIngredients.includes(vi.ingredient.name)
            );
            
            // Relevance score: number of matching ingredients / total ingredients in search
            const relevanceScore = matchingIngredients.length / normalizedIngredients.length;
            
            return {
              id: video.id,
              youtubeId: video.youtubeId,
              title: video.title,
              description: video.description,
              thumbnailUrl: video.thumbnailUrl,
              publishedAt: video.publishedAt,
              views: video.views,
              relevanceScore,
              ingredients: video.videoIngredients.map((vi: any) => ({
                id: vi.ingredient.id,
                name: vi.ingredient.name,
                confidence: vi.confidence,
                source: vi.source,
              })),
            };
          });

          // Sort by relevance score (descending)
          resultsWithScores.sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

          // Log search pattern (moat contribution)
          // Store search in database (even without user auth for now)
          try {
            await ctx.prisma.search.create({
              data: {
                ingredients: normalizedIngredients,
                userId: ctx.userId || null,
              },
            });
          } catch (error) {
            // Log error but don't fail the search
            console.error('Failed to log search:', error);
          }

          // TODO: Calculate demand signals (Week 6)
          // TODO: Detect opportunities (Week 7)
          
          return {
            videos: resultsWithScores,
            demand: 'unknown' as const,
            opportunities: [],
          };
        } catch (error) {
          console.error('Search error:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to perform search',
          });
        }
      }),
  });
}
