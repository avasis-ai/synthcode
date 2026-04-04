import { setTimeout } from "timers/promises";

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  backoffFactor: number;
}

export interface RetryPolicy<T> {
  execute: (
    attemptFn: () => Promise<T>,
    config: RetryConfig
  ) => Promise<T>;
}

class RetryPolicyEngine<T> implements RetryPolicy<T> {
  private readonly config: RetryConfig;

  constructor(config: RetryConfig) {
    this.config = config;
  }

  async execute(
    attemptFn: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < config.maxAttempts) {
      try {
        return await attemptFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;

        if (attempt >= config.maxAttempts) {
          throw new Error(
            `Tool invocation failed after ${config.maxAttempts} attempts. Last error: ${lastError.message}`
          );
        }

        const delay = this.calculateDelay(attempt);
        await setTimeout(delay);
      }
    }
    throw new Error("Should not reach here");
  }

  private calculateDelay(attempt: number): Promise<number> {
    const delay = Math.min(
      config.initialDelayMs * Math.pow(config.backoffFactor, attempt - 1),
      30000
    );
    // Add jitter: random delay between 0 and 10% of the calculated delay
    const jitter = Math.random() * delay * 0.1;
    return Promise.resolve(Math.round(delay + jitter));
  }
}

export const createRetryPolicy = <T>(config: RetryConfig): RetryPolicy<T> => {
  return new RetryPolicyEngine<T>(config);
};