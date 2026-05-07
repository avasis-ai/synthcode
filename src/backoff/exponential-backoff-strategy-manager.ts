export type RetryConfig = {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  jitterFactor: number;
};

export type Callable<T> = () => Promise<T>;

export class ExponentialBackoffStrategyManager {
  private static randomDelay(baseDelay: number, jitterFactor: number): number {
    const jitter = Math.random() * jitterFactor * baseDelay;
    return Math.max(1, baseDelay + jitter);
  }

  private static calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = Math.min(
      config.maxDelayMs,
      config.initialDelayMs * Math.pow(2, attempt - 1)
    );
    return ExponentialBackoffStrategyManager.randomDelay(exponentialDelay, config.jitterFactor);
  }

  public static async withExponentialBackoff<T>(
    apiCall: Callable<T>,
    config: RetryConfig
  ): Promise<T> {
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (attempt === config.maxAttempts) {
          throw new Error(
            `API call failed after ${config.maxAttempts} attempts. Last error: ${(error as Error).message}`
          );
        }

        const delay = ExponentialBackoffStrategyManager.calculateDelay(
          attempt,
          config
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error("Should not reach here");
  }
}

export { ExponentialBackoffStrategyManager };