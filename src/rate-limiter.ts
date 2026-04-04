import { performance } from 'node:perf_hooks';

export interface RateLimiterStrategy {
  canAcquire(resourceId: string): { allowed: boolean; waitTimeMs: number };
}

export class RateLimiter {
  private strategy: RateLimiterStrategy;
  private resourceId: string;

  constructor(strategy: RateLimiterStrategy, resourceId: string) {
    this.strategy = strategy;
    this.resourceId = resourceId;
  }

  public async tryAcquire(): Promise<void> {
    const { allowed, waitTimeMs } = this.strategy.canAcquire(this.resourceId);

    if (allowed) {
      return Promise.resolve();
    }

    if (waitTimeMs > 0) {
      await new Promise<void>(resolve => setTimeout(resolve, waitTimeMs));
      // Re-check after waiting, assuming the strategy updates state correctly
      const { allowed: reAllowed } = this.strategy.canAcquire(this.resourceId);
      if (reAllowed) {
        return;
      }
    }

    throw new Error("Rate limit exceeded");
  }
}

export class TokenBucketStrategy implements RateLimiterStrategy {
  private buckets: Map<string, { tokens: number; lastRefillTime: number }>;
  private capacity: number;
  private refillRate: number; // tokens per millisecond

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.buckets = new Map<string, { tokens: number; lastRefillTime: number }>();
  }

  private getBucket(resourceId: string) {
    if (!this.buckets.has(resourceId)) {
      this.buckets.set(resourceId, { tokens: this.capacity, lastRefillTime: performance.now() });
    }
    return this.buckets.get(resourceId)!;
  }

  private refill(bucket: { tokens: number; lastRefillTime: number }): { tokens: number; lastRefillTime: number } {
    const now = performance.now();
    const timePassed = now - bucket.lastRefillTime;
    const tokensToAdd = timePassed * this.refillRate;

    const newTokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
    return { tokens: newTokens, lastRefillTime: now };
  }

  public canAcquire(resourceId: string): { allowed: boolean; waitTimeMs: number } {
    let bucket = this.getBucket(resourceId);
    bucket = this.refill(bucket);

    const cost = 1; // Assume cost of 1 token per request

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      this.buckets.set(resourceId, bucket);
      return { allowed: true, waitTimeMs: 0 };
    } else {
      const neededTokens = cost - bucket.tokens;
      const waitTimeMs = (neededTokens / this.refillRate) * 1000;

      return { allowed: false, waitTimeMs: Math.ceil(waitTimeMs) };
    }
  }
}