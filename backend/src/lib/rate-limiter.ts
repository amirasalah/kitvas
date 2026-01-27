/**
 * Rate Limiter for YouTube API Searches
 * Limits users to 10 YouTube API searches per hour
 * Database-only searches are unlimited
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limits = new Map<string, RateLimitEntry>();
const RATE_LIMIT = 10; // searches per window
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a rate limit key from userId or IP
 */
function getRateLimitKey(userId: string | null, ip: string): string {
  return userId || `ip:${ip}`;
}

/**
 * Check if user can make a YouTube API search
 * Returns true if under limit, false if rate limited
 */
export function checkRateLimit(userId: string | null, ip: string): boolean {
  const key = getRateLimitKey(userId, ip);
  const entry = limits.get(key);
  const now = Date.now();

  // No entry or window expired - allowed
  if (!entry || now >= entry.resetAt) {
    return true;
  }

  // Check if under limit
  return entry.count < RATE_LIMIT;
}

/**
 * Increment the rate limit counter after a YouTube API search
 */
export function incrementRateLimit(userId: string | null, ip: string): void {
  const key = getRateLimitKey(userId, ip);
  const now = Date.now();
  const entry = limits.get(key);

  if (!entry || now >= entry.resetAt) {
    // Start new window
    limits.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
  } else {
    // Increment existing window
    entry.count += 1;
  }
}

/**
 * Get remaining searches for a user
 */
export function getRemainingSearches(userId: string | null, ip: string): number {
  const key = getRateLimitKey(userId, ip);
  const entry = limits.get(key);
  const now = Date.now();

  if (!entry || now >= entry.resetAt) {
    return RATE_LIMIT;
  }

  return Math.max(0, RATE_LIMIT - entry.count);
}

/**
 * Get time until rate limit resets (in seconds)
 */
export function getResetTime(userId: string | null, ip: string): number {
  const key = getRateLimitKey(userId, ip);
  const entry = limits.get(key);
  const now = Date.now();

  if (!entry || now >= entry.resetAt) {
    return 0;
  }

  return Math.ceil((entry.resetAt - now) / 1000);
}

/**
 * Clean up expired entries
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of limits.entries()) {
    if (now >= entry.resetAt) {
      limits.delete(key);
    }
  }
}
