import { z } from 'zod';

// Video types
export const VideoSchema = z.object({
  id: z.string(),
  youtubeId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  thumbnailUrl: z.string(),
  publishedAt: z.date(),
  views: z.number().optional(),
  extractedAt: z.date().optional(),
});

export type Video = z.infer<typeof VideoSchema>;

// Ingredient types
export const IngredientSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Ingredient = z.infer<typeof IngredientSchema>;

// Video Ingredient (join table)
export const VideoIngredientSchema = z.object({
  videoId: z.string(),
  ingredientId: z.string(),
  confidence: z.number().min(0).max(1),
  source: z.enum(['title', 'description', 'transcript']),
});

export type VideoIngredient = z.infer<typeof VideoIngredientSchema>;

// Search types
export const SearchInputSchema = z.object({
  ingredients: z.array(z.string()).min(1).max(10),
  tags: z.array(z.string()).optional(),
});

export type SearchInput = z.infer<typeof SearchInputSchema>;

export const SearchResultSchema = z.object({
  video: VideoSchema,
  ingredients: z.array(IngredientSchema),
  relevanceScore: z.number(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;
