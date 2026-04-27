import { EventEmitter } from "node:events";

export type Message = { role: "user"; content: string } | { role: "assistant"; content: any[] } | { role: "tool"; tool_use_id: string; content: string; is_error?: boolean };

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_use"; id: string };

export class RateLimiter {
  private readonly rate: number; // Tokens per second
  private readonly capacity: number;
  private tokens: number;
  private lastRefillTime: number;

  constructor(limitPerSecond: number, capacity: number) {
    this.rate = limitPerSecond;
    this.capacity = capacity;
    this.tokens = capacity;
    this.lastRefillTime = Date.now();
  }

  private refillTokens(): void {
    const now = Date.now();
    const timeElapsed = now - this.lastRefillTime;
    const tokensToAdd = (timeElapsed / 1000) * this.rate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }

  /**
   * Attempts to acquire tokens. If insufficient tokens are available,
   * it calculates the required wait time and returns a Promise that resolves
   * after waiting for the necessary time.
   * @param cost The number of tokens required for the operation.
   * @returns A Promise that resolves when tokens are acquired.
   */
  public async acquireToken(cost: number): Promise<void> {
    if (cost <= 0) {
      return Promise.resolve();
    }

    this.refillTokens();

    if (this.tokens >= cost) {
      this.tokens -= cost;
      return Promise.resolve();
    }

    const neededTokens = cost - this.tokens;
    // Time needed (seconds) = Tokens needed / Rate (tokens/second)
    const waitTimeSeconds = neededTokens / this.rate;
    const waitTimeMs = Math.ceil(waitTimeSeconds * 1000);

    if (waitTimeMs > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTimeMs));
      // After waiting, refill again to account for the time passed
      this.refillTokens();
      // Since we waited for the required time, we should now have enough tokens
      this.tokens -= cost;
    } else {
      // Should not happen if logic is correct, but as a fallback
      this.tokens = Math.max(0, this.tokens - cost);
    }
  }
}

export { RateLimiter };