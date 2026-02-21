import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TRPCError } from '@trpc/server';
import { createPublicCaller, disconnectPrisma } from './helpers/test-context.js';

describe('search router', () => {
  let caller: ReturnType<typeof createPublicCaller>;

  beforeAll(() => {
    caller = createPublicCaller();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  describe('autocomplete', () => {
    it('returns an array of strings for a valid query', async () => {
      const result = await caller.search.autocomplete({ query: 'chick' });
      expect(Array.isArray(result)).toBe(true);
      for (const item of result) {
        expect(typeof item).toBe('string');
      }
    });

    it('returns at most 10 results', async () => {
      const result = await caller.search.autocomplete({ query: 'a' });
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('returns empty array for obscure query', async () => {
      const result = await caller.search.autocomplete({ query: 'xyznonexistent999' });
      expect(Array.isArray(result)).toBe(true);
    });

    it('rejects empty query', async () => {
      await expect(
        caller.search.autocomplete({ query: '' })
      ).rejects.toThrow();
    });

    it('rejects query exceeding 50 characters', async () => {
      await expect(
        caller.search.autocomplete({ query: 'a'.repeat(51) })
      ).rejects.toThrow();
    });
  });

  describe('search', () => {
    // Single consolidated test — search.search calls YouTube API + Groq LLM
    // for fresh videos, so each invocation takes 30-120s depending on cache state
    it('returns correct response and video shapes', async () => {
      const result = await caller.search.search({
        ingredients: ['chicken', 'garlic'],
      });

      // Top-level shape
      expect(result).toHaveProperty('analyzedVideos');
      expect(result).toHaveProperty('youtubeVideos');
      expect(result).toHaveProperty('rateLimitRemaining');
      expect(result).toHaveProperty('demand');
      expect(result).toHaveProperty('demandSignal');
      expect(Array.isArray(result.analyzedVideos)).toBe(true);
      expect(Array.isArray(result.youtubeVideos)).toBe(true);

      // Demand signal shape
      expect(result.demandSignal).toHaveProperty('demandScore');
      expect(result.demandSignal).toHaveProperty('contentGap');
      expect(result.demandSignal).toHaveProperty('confidence');

      // Video item shape (when results exist)
      if (result.analyzedVideos.length > 0) {
        const video = result.analyzedVideos[0];
        expect(video).toHaveProperty('id');
        expect(video).toHaveProperty('youtubeId');
        expect(video).toHaveProperty('title');
        expect(video).toHaveProperty('relevanceScore');
        expect(video).toHaveProperty('ingredients');
        expect(video).toHaveProperty('tags');
      }
    }, 300_000);

    it('rejects fewer than 2 ingredients', async () => {
      await expect(
        caller.search.search({ ingredients: ['chicken'] })
      ).rejects.toThrow();
    });

    it('rejects more than 10 ingredients', async () => {
      const tooMany = Array.from({ length: 11 }, (_, i) => `ingredient${i}`);
      await expect(
        caller.search.search({ ingredients: tooMany })
      ).rejects.toThrow();
    });
  });

  describe('getTranscript', () => {
    it('throws NOT_FOUND for a nonexistent video ID', async () => {
      try {
        await caller.search.getTranscript({ videoId: 'nonexistent-id-xyz' });
        expect.unreachable('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('NOT_FOUND');
      }
    });
  });

  describe('translateTranscript', () => {
    it('throws NOT_FOUND for a nonexistent video ID', async () => {
      try {
        await caller.search.translateTranscript({ videoId: 'nonexistent-id-xyz' });
        expect.unreachable('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('NOT_FOUND');
      }
    });
  });
});
