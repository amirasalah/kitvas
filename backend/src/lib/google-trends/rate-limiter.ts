/**
 * Google Trends Rate Limiter
 *
 * Google Trends unofficial API has strict rate limits:
 * - Too many requests result in temporary blocks
 * - Requests need random delays to appear human-like
 *
 * Strategy:
 * - Token bucket algorithm (5 tokens/minute)
 * - Random delay 1-3 seconds between requests
 * - Exponential backoff on errors (1s, 2s, 4s, 8s...)
 * - Max retry count: 3
 */

export class TrendsRateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRateMs: number; // ms per token
  private lastRefill: number;
  private backoffMs: number;
  private consecutiveErrors: number;
  private maxRetries: number;

  constructor(options?: { maxRequestsPerMinute?: number; maxRetries?: number }) {
    this.maxTokens = options?.maxRequestsPerMinute || 5;
    this.tokens = this.maxTokens;
    this.refillRateMs = 60000 / this.maxTokens; // e.g., 12000ms per token for 5/min
    this.lastRefill = Date.now();
    this.backoffMs = 1000; // Start with 1 second
    this.consecutiveErrors = 0;
    this.maxRetries = options?.maxRetries || 3;
  }

  /**
   * Wait for a token to become available
   * Includes random delay to appear human-like
   */
  async waitForToken(): Promise<void> {
    this.refillTokens();

    if (this.tokens < 1) {
      // Calculate wait time until next token
      const waitTime = this.refillRateMs - (Date.now() - this.lastRefill);
      if (waitTime > 0) {
        await this.sleep(waitTime);
      }
      this.refillTokens();
    }

    // Consume a token
    this.tokens--;

    // Add random delay (1-3 seconds) to appear human-like
    const randomDelay = 1000 + Math.random() * 2000;
    await this.sleep(randomDelay);

    // If we're in backoff mode, add additional delay
    if (this.backoffMs > 1000) {
      await this.sleep(this.backoffMs);
    }
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = Math.floor(elapsed / this.refillRateMs);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  /**
   * Report a successful request - reset backoff
   */
  reportSuccess(): void {
    this.consecutiveErrors = 0;
    this.backoffMs = 1000;
  }

  /**
   * Report an error - increase backoff exponentially
   */
  reportError(): void {
    this.consecutiveErrors++;
    this.backoffMs = Math.min(30000, this.backoffMs * 2); // Max 30 seconds
  }

  /**
   * Check if we should retry after an error
   */
  shouldRetry(): boolean {
    return this.consecutiveErrors < this.maxRetries;
  }

  /**
   * Get current backoff time in milliseconds
   */
  getBackoffMs(): number {
    return this.backoffMs;
  }

  /**
   * Get remaining tokens (for monitoring)
   */
  getRemainingTokens(): number {
    this.refillTokens();
    return this.tokens;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance for shared rate limiting across the app
let globalRateLimiter: TrendsRateLimiter | null = null;

export function getGlobalRateLimiter(): TrendsRateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new TrendsRateLimiter();
  }
  return globalRateLimiter;
}
