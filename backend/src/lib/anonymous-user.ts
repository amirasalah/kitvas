/**
 * Anonymous User Utilities
 *
 * Provides stable anonymous user identification for unauthenticated users.
 * This allows tracking corrections and outcomes consistently before auth is implemented.
 */

import type { Context } from '../context.js';

/**
 * Get or create a stable anonymous user ID
 * Uses a hash of client IP for stability across requests
 * This allows tracking anonymous user corrections consistently
 *
 * @param ctx - Request context
 * @returns Stable user ID (real if authenticated, anonymous hash otherwise)
 */
export function getStableAnonymousId(ctx: Context): string {
  // If authenticated, use real user ID
  if (ctx.userId) return ctx.userId;

  // Use clientIp from context for stable identification
  // In production, this should be replaced with proper session cookies
  const identifier = ctx.clientIp || 'unknown';

  // Create a simple hash from the IP
  // This gives the same ID for the same IP
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `anon-${Math.abs(hash).toString(36)}`;
}
