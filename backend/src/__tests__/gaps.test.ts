import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createPublicCaller, disconnectPrisma } from './helpers/test-context.js';

describe('gaps router', () => {
  let caller: ReturnType<typeof createPublicCaller>;

  beforeAll(() => {
    caller = createPublicCaller();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  describe('findGaps', () => {
    it('returns correct top-level shape', async () => {
      const result = await caller.gaps.findGaps({ ingredients: ['chicken'] });
      expect(result).toHaveProperty('baseIngredients');
      expect(result).toHaveProperty('gaps');
      expect(result).toHaveProperty('totalVideos');
      expect(result).toHaveProperty('source', 'recipe_analysis');
      expect(Array.isArray(result.gaps)).toBe(true);
      expect(Array.isArray(result.baseIngredients)).toBe(true);
    });

    it('gap items have correct shape when data exists', async () => {
      const result = await caller.gaps.findGaps({ ingredients: ['chicken'] });
      for (const gap of result.gaps) {
        expect(gap).toHaveProperty('ingredient');
        expect(gap).toHaveProperty('coOccurrenceCount');
        expect(gap).toHaveProperty('videoCount');
        expect(gap).toHaveProperty('gapScore');
        expect(gap).toHaveProperty('demandBand');
        expect(gap).toHaveProperty('trendsInsight');
        expect(gap).toHaveProperty('trendsGrowth');
        expect(gap).toHaveProperty('isBreakout');
        expect(typeof gap.ingredient).toBe('string');
        expect(typeof gap.gapScore).toBe('number');
        expect(typeof gap.isBreakout).toBe('boolean');
      }
    });

    it('returns at most 10 gap suggestions', async () => {
      const result = await caller.gaps.findGaps({ ingredients: ['chicken'] });
      expect(result.gaps.length).toBeLessThanOrEqual(10);
    });

    it('returns empty gaps for obscure ingredient', async () => {
      const result = await caller.gaps.findGaps({ ingredients: ['xyznonexistent999'] });
      expect(result.gaps).toHaveLength(0);
      expect(result.totalVideos).toBe(0);
    });

    it('accepts up to 5 ingredients', async () => {
      const result = await caller.gaps.findGaps({
        ingredients: ['chicken', 'garlic', 'onion', 'tomato', 'basil'],
      });
      expect(result.baseIngredients).toHaveLength(5);
    });

    it('rejects empty ingredients array', async () => {
      await expect(
        caller.gaps.findGaps({ ingredients: [] })
      ).rejects.toThrow();
    });

    it('rejects more than 5 ingredients', async () => {
      await expect(
        caller.gaps.findGaps({
          ingredients: ['a', 'b', 'c', 'd', 'e', 'f'],
        })
      ).rejects.toThrow();
    });

    it('normalizes ingredients to lowercase', async () => {
      const result = await caller.gaps.findGaps({ ingredients: ['CHICKEN'] });
      expect(result.baseIngredients).toContain('chicken');
    });

    it('gaps are sorted by gapScore descending', async () => {
      const result = await caller.gaps.findGaps({ ingredients: ['chicken'] });
      for (let i = 1; i < result.gaps.length; i++) {
        expect(result.gaps[i - 1].gapScore).toBeGreaterThanOrEqual(result.gaps[i].gapScore);
      }
    });
  });
});
