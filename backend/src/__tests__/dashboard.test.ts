import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createPublicCaller, disconnectPrisma } from './helpers/test-context.js';

describe('dashboard router', () => {
  let caller: ReturnType<typeof createPublicCaller>;

  beforeAll(() => {
    caller = createPublicCaller();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  describe('overview', () => {
    it('returns topics and sources', async () => {
      const result = await caller.dashboard.overview({ period: '24h' });
      expect(result).toHaveProperty('topics');
      expect(result).toHaveProperty('sources');
      expect(Array.isArray(result.topics)).toBe(true);
      expect(Array.isArray(result.sources)).toBe(true);
    });

    it('accepts all period values', async () => {
      for (const period of ['1h', '24h', '7d', '30d'] as const) {
        const result = await caller.dashboard.overview({ period });
        expect(result).toHaveProperty('topics');
        expect(result).toHaveProperty('sources');
      }
    });

    it('returns at most 20 topics', async () => {
      const result = await caller.dashboard.overview({ period: '30d' });
      expect(result.topics.length).toBeLessThanOrEqual(20);
    });

    it('topic items have correct shape when data exists', async () => {
      const result = await caller.dashboard.overview({ period: '30d' });
      for (const topic of result.topics) {
        expect(topic).toHaveProperty('id');
        expect(topic).toHaveProperty('topic');
        expect(topic).toHaveProperty('period');
        expect(topic).toHaveProperty('trendScore');
        expect(topic).toHaveProperty('sources');
        expect(topic).toHaveProperty('mentionCount');
        expect(topic).toHaveProperty('youtubeCount');
        expect(topic).toHaveProperty('webCount');
        expect(topic).toHaveProperty('isBreakout');
      }
    });
  });

  describe('topTopics', () => {
    it('returns an array with correct defaults', async () => {
      const result = await caller.dashboard.topTopics({});
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('respects limit parameter', async () => {
      const result = await caller.dashboard.topTopics({ period: '24h', limit: 3 });
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('accepts all period values', async () => {
      for (const period of ['1h', '24h', '7d', '30d'] as const) {
        const result = await caller.dashboard.topTopics({ period, limit: 2 });
        expect(Array.isArray(result)).toBe(true);
      }
    });
  });

  describe('youtubeTrending', () => {
    it('returns an array of video objects', async () => {
      const result = await caller.dashboard.youtubeTrending({ period: '7d' });
      expect(Array.isArray(result)).toBe(true);
    });

    it('video items have correct shape when data exists', async () => {
      const result = await caller.dashboard.youtubeTrending({ period: '30d' });
      for (const video of result) {
        expect(video).toHaveProperty('id');
        expect(video).toHaveProperty('youtubeId');
        expect(video).toHaveProperty('title');
        expect(video).toHaveProperty('thumbnailUrl');
        expect(video).toHaveProperty('views');
        expect(video).toHaveProperty('ingredients');
        expect(video).toHaveProperty('tags');
        expect(Array.isArray(video.ingredients)).toBe(true);
        expect(Array.isArray(video.tags)).toBe(true);
      }
    });

    it('returns at most 20 videos', async () => {
      const result = await caller.dashboard.youtubeTrending({ period: '30d' });
      expect(result.length).toBeLessThanOrEqual(20);
    });
  });

  describe('webLatest', () => {
    it('returns an array of articles', async () => {
      const result = await caller.dashboard.webLatest({ period: '7d' });
      expect(Array.isArray(result)).toBe(true);
    });

    it('accepts optional source filter', async () => {
      const result = await caller.dashboard.webLatest({ period: '30d', source: 'bonappetit' });
      expect(Array.isArray(result)).toBe(true);
    });

    it('returns at most 20 articles', async () => {
      const result = await caller.dashboard.webLatest({ period: '30d' });
      expect(result.length).toBeLessThanOrEqual(20);
    });

    it('article items have correct shape when data exists', async () => {
      const result = await caller.dashboard.webLatest({ period: '30d' });
      for (const article of result) {
        expect(article).toHaveProperty('id');
        expect(article).toHaveProperty('url');
        expect(article).toHaveProperty('source');
        expect(article).toHaveProperty('title');
        expect(article).toHaveProperty('publishedAt');
        expect(typeof article.url).toBe('string');
      }
    });
  });

  describe('sourceStatus', () => {
    it('returns an array of platform sources', async () => {
      const result = await caller.dashboard.sourceStatus();
      expect(Array.isArray(result)).toBe(true);
    });

    it('source items have correct shape when data exists', async () => {
      const result = await caller.dashboard.sourceStatus();
      for (const source of result) {
        expect(source).toHaveProperty('id');
        expect(source).toHaveProperty('platform');
        expect(source).toHaveProperty('lastFetchedAt');
        expect(source).toHaveProperty('lastStatus');
        expect(source).toHaveProperty('itemsFetched');
      }
    });
  });
});
