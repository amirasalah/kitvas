import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createPublicCaller, disconnectPrisma } from './helpers/test-context.js';

describe('analytics router', () => {
  let caller: ReturnType<typeof createPublicCaller>;

  beforeAll(() => {
    caller = createPublicCaller();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  describe('hotIngredients', () => {
    it('returns correct shape with default params', async () => {
      const result = await caller.analytics.hotIngredients({});
      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('ingredients');
      expect(result).toHaveProperty('hasGoogleTrends');
      expect(Array.isArray(result.ingredients)).toBe(true);
    });

    it('respects limit parameter', async () => {
      const result = await caller.analytics.hotIngredients({ period: 'week', limit: 5 });
      expect(result.ingredients.length).toBeLessThanOrEqual(5);
    });

    it('accepts all period values', async () => {
      for (const period of ['today', 'week', 'month'] as const) {
        const result = await caller.analytics.hotIngredients({ period });
        expect(result.period).toBe(period);
      }
    });

    it('returns ingredient items with correct shape', async () => {
      const result = await caller.analytics.hotIngredients({ period: 'month', limit: 3 });
      for (const ing of result.ingredients) {
        expect(ing).toHaveProperty('name');
        expect(ing).toHaveProperty('interest');
        expect(ing).toHaveProperty('growth');
        expect(ing).toHaveProperty('isBreakout');
        expect(ing).toHaveProperty('rank');
        expect(typeof ing.name).toBe('string');
        expect(typeof ing.rank).toBe('number');
      }
    });
  });

  describe('relatedAngles', () => {
    it('returns correct shape', async () => {
      const result = await caller.analytics.relatedAngles({ ingredient: 'chicken' });
      expect(result).toHaveProperty('ingredient', 'chicken');
      expect(result).toHaveProperty('contentAngles');
      expect(result).toHaveProperty('hasData');
      expect(Array.isArray(result.contentAngles)).toBe(true);
    });

    it('returns hasData=false for obscure ingredient', async () => {
      const result = await caller.analytics.relatedAngles({ ingredient: 'xyznonexistent999' });
      expect(result.hasData).toBe(false);
      expect(result.contentAngles).toHaveLength(0);
    });

    it('normalizes ingredient name to lowercase', async () => {
      const result = await caller.analytics.relatedAngles({ ingredient: 'CHICKEN' });
      expect(result.ingredient).toBe('chicken');
    });

    it('respects limit parameter', async () => {
      const result = await caller.analytics.relatedAngles({ ingredient: 'chicken', limit: 2 });
      expect(result.contentAngles.length).toBeLessThanOrEqual(2);
    });
  });

  describe('trending', () => {
    it('returns correct shape with defaults', async () => {
      const result = await caller.analytics.trending({});
      expect(result).toHaveProperty('period', '7d');
      expect(result).toHaveProperty('periodStart');
      expect(result).toHaveProperty('periodEnd');
      expect(result).toHaveProperty('totalSearches');
      expect(result).toHaveProperty('trending');
      expect(Array.isArray(result.trending)).toBe(true);
    });

    it('accepts all period values', async () => {
      for (const period of ['7d', '30d', '90d'] as const) {
        const result = await caller.analytics.trending({ period, limit: 5 });
        expect(result.period).toBe(period);
      }
    });

    it('trending items have correct shape', async () => {
      const result = await caller.analytics.trending({ limit: 5 });
      for (const item of result.trending) {
        expect(item).toHaveProperty('ingredient');
        expect(item).toHaveProperty('searchCount');
        expect(item).toHaveProperty('growth');
        expect(item).toHaveProperty('videoCount');
        expect(typeof item.ingredient).toBe('string');
        expect(typeof item.searchCount).toBe('number');
      }
    });
  });

  describe('seasonal', () => {
    it('returns correct shape with defaults', async () => {
      const result = await caller.analytics.seasonal({});
      expect(result).toHaveProperty('months', 12);
      expect(result).toHaveProperty('patterns');
      expect(Array.isArray(result.patterns)).toBe(true);
    });

    it('accepts ingredient filter', async () => {
      const result = await caller.analytics.seasonal({ ingredient: 'chicken', months: 6 });
      expect(result.months).toBe(6);
      expect(Array.isArray(result.patterns)).toBe(true);
    });

    it('pattern items have correct shape', async () => {
      const result = await caller.analytics.seasonal({ months: 3 });
      for (const pattern of result.patterns) {
        expect(pattern).toHaveProperty('month');
        expect(pattern).toHaveProperty('totalSearches');
        expect(pattern).toHaveProperty('topIngredients');
        expect(pattern.month).toMatch(/^\d{4}-\d{2}$/);
      }
    });
  });

  describe('contentGaps', () => {
    it('returns correct shape with defaults', async () => {
      const result = await caller.analytics.contentGaps({});
      expect(result).toHaveProperty('minSearches');
      expect(result).toHaveProperty('gaps');
      expect(Array.isArray(result.gaps)).toBe(true);
    });

    it('gap items have correct shape when data exists', async () => {
      const result = await caller.analytics.contentGaps({ minSearches: 1, limit: 5 });
      for (const gap of result.gaps) {
        expect(gap).toHaveProperty('ingredients');
        expect(gap).toHaveProperty('ingredientKey');
        expect(gap).toHaveProperty('searchCount');
        expect(gap).toHaveProperty('gapScore');
        expect(gap).toHaveProperty('demandBand');
        expect(Array.isArray(gap.ingredients)).toBe(true);
      }
    });

    it('respects limit parameter', async () => {
      const result = await caller.analytics.contentGaps({ minSearches: 1, limit: 3 });
      expect(result.gaps.length).toBeLessThanOrEqual(3);
    });
  });

  describe('coOccurrence', () => {
    it('returns correct shape', async () => {
      const result = await caller.analytics.coOccurrence({ ingredient: 'chicken' });
      expect(result).toHaveProperty('ingredient', 'chicken');
      expect(result).toHaveProperty('totalSearches');
      expect(result).toHaveProperty('coOccurrences');
      expect(Array.isArray(result.coOccurrences)).toBe(true);
    });

    it('coOccurrence items have correct shape', async () => {
      const result = await caller.analytics.coOccurrence({ ingredient: 'chicken', limit: 5 });
      for (const item of result.coOccurrences) {
        expect(item).toHaveProperty('pairedWith');
        expect(item).toHaveProperty('coSearchCount');
        expect(item).toHaveProperty('avgViews');
        expect(item).toHaveProperty('demandBand');
        expect(item).toHaveProperty('contentGapScore');
      }
    });

    it('returns empty for nonexistent ingredient', async () => {
      const result = await caller.analytics.coOccurrence({ ingredient: 'xyznonexistent999' });
      expect(result.totalSearches).toBe(0);
      expect(result.coOccurrences).toHaveLength(0);
    });
  });

  describe('dashboard', () => {
    it('returns correct shape', async () => {
      const result = await caller.analytics.dashboard();
      expect(result).toHaveProperty('weeklyStats');
      expect(result).toHaveProperty('trending');
      expect(result).toHaveProperty('topGaps');
      expect(result.weeklyStats).toHaveProperty('searches');
      expect(typeof result.weeklyStats.searches).toBe('number');
      expect(Array.isArray(result.trending)).toBe(true);
      expect(Array.isArray(result.topGaps)).toBe(true);
    });

    it('trending items have ingredient and searchCount', async () => {
      const result = await caller.analytics.dashboard();
      for (const item of result.trending) {
        expect(item).toHaveProperty('ingredient');
        expect(item).toHaveProperty('searchCount');
      }
    });

    it('topGaps items have correct shape', async () => {
      const result = await caller.analytics.dashboard();
      for (const gap of result.topGaps) {
        expect(gap).toHaveProperty('ingredients');
        expect(gap).toHaveProperty('gapScore');
        expect(gap).toHaveProperty('demandBand');
      }
    });
  });

  describe('ingredientTrends', () => {
    it('returns found=false for nonexistent ingredient', async () => {
      const result = await caller.analytics.ingredientTrends({ ingredient: 'xyznonexistent999' });
      expect(result.found).toBe(false);
      expect(result.trends).toHaveLength(0);
      expect(result.summary).toBeNull();
    });

    it('returns correct shape for known ingredient', async () => {
      const result = await caller.analytics.ingredientTrends({ ingredient: 'chicken' });
      expect(result).toHaveProperty('ingredient', 'chicken');
      expect(result).toHaveProperty('found');
      expect(result).toHaveProperty('trends');
      expect(Array.isArray(result.trends)).toBe(true);

      if (result.found && result.trends.length > 0) {
        const trend = result.trends[0];
        expect(trend).toHaveProperty('periodStart');
        expect(trend).toHaveProperty('searchCount');
        expect(trend).toHaveProperty('videoCount');
      }

      if (result.summary) {
        expect(result.summary).toHaveProperty('totalSearches');
        expect(result.summary).toHaveProperty('trendDirection');
        expect(['up', 'down', 'stable']).toContain(result.summary.trendDirection);
      }
    });

    it('accepts all period values', async () => {
      for (const period of ['daily', 'weekly', 'monthly'] as const) {
        const result = await caller.analytics.ingredientTrends({
          ingredient: 'chicken',
          period,
          limit: 3,
        });
        expect(result).toHaveProperty('ingredient', 'chicken');
      }
    });
  });

  describe('topIngredientTrends', () => {
    it('returns correct shape with defaults', async () => {
      const result = await caller.analytics.topIngredientTrends({});
      expect(result).toHaveProperty('period', 'weekly');
      expect(result).toHaveProperty('periodStart');
      expect(result).toHaveProperty('ingredients');
      expect(Array.isArray(result.ingredients)).toBe(true);
    });

    it('respects limit parameter', async () => {
      const result = await caller.analytics.topIngredientTrends({ period: 'daily', limit: 5 });
      expect(Array.isArray(result.ingredients)).toBe(true);
      expect(result.ingredients.length).toBeLessThanOrEqual(5);
    });

    it('ingredient items have correct shape when data exists', async () => {
      const result = await caller.analytics.topIngredientTrends({ period: 'weekly', limit: 5 });
      for (const item of result.ingredients) {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('searchCount');
        expect(item).toHaveProperty('videoCount');
        expect(item).toHaveProperty('avgViews');
        expect(item).toHaveProperty('growth');
        expect(typeof item.name).toBe('string');
        expect(typeof item.growth).toBe('number');
      }
    });
  });
});
