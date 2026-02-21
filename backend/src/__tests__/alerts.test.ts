import { describe, it, expect, afterAll } from 'vitest';
import { TRPCError } from '@trpc/server';
import {
  createPublicCaller,
  createAuthenticatedCaller,
  disconnectPrisma,
  getPrisma,
} from './helpers/test-context.js';

describe('alerts router', () => {
  afterAll(async () => {
    // Clean up test user's alert subscription
    const prisma = getPrisma();
    const testUser = await prisma.user.findUnique({
      where: { email: 'test-e2e@kitvas.dev' },
    });
    if (testUser) {
      await prisma.alertSubscription.deleteMany({
        where: { userId: testUser.id },
      });
    }
    await disconnectPrisma();
  });

  describe('auth guard', () => {
    it('getStatus rejects unauthenticated callers', async () => {
      const publicCaller = createPublicCaller();
      try {
        await publicCaller.alerts.getStatus();
        expect.unreachable('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('UNAUTHORIZED');
      }
    });

    it('subscribe rejects unauthenticated callers', async () => {
      const publicCaller = createPublicCaller();
      try {
        await publicCaller.alerts.subscribe();
        expect.unreachable('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('UNAUTHORIZED');
      }
    });

    it('unsubscribe rejects unauthenticated callers', async () => {
      const publicCaller = createPublicCaller();
      try {
        await publicCaller.alerts.unsubscribe();
        expect.unreachable('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('UNAUTHORIZED');
      }
    });
  });

  describe('authenticated flow', () => {
    it('full subscribe/status/unsubscribe lifecycle', async () => {
      const caller = await createAuthenticatedCaller();

      // 1. Check initial status
      const initialStatus = await caller.alerts.getStatus();
      expect(initialStatus).toHaveProperty('enabled');
      expect(typeof initialStatus.enabled).toBe('boolean');

      // 2. Subscribe
      const subscribeResult = await caller.alerts.subscribe();
      expect(subscribeResult).toEqual({ enabled: true });

      // 3. Verify status is now enabled
      const afterSubscribe = await caller.alerts.getStatus();
      expect(afterSubscribe.enabled).toBe(true);

      // 4. Unsubscribe
      const unsubscribeResult = await caller.alerts.unsubscribe();
      expect(unsubscribeResult).toEqual({ enabled: false });

      // 5. Verify status is now disabled
      const afterUnsubscribe = await caller.alerts.getStatus();
      expect(afterUnsubscribe.enabled).toBe(false);
    });

    it('subscribe is idempotent', async () => {
      const caller = await createAuthenticatedCaller();
      await caller.alerts.subscribe();
      const secondCall = await caller.alerts.subscribe();
      expect(secondCall.enabled).toBe(true);
      // Cleanup
      await caller.alerts.unsubscribe();
    });

    it('unsubscribe is idempotent', async () => {
      const caller = await createAuthenticatedCaller();
      await caller.alerts.unsubscribe();
      const secondCall = await caller.alerts.unsubscribe();
      expect(secondCall.enabled).toBe(false);
    });
  });
});
