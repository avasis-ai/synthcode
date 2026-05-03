import { setTimeout } from "timers/promises";

export interface RetryContext {
  attemptCount: number;
  lastError: Error | null;
  history: {
    attempt: number;
    success: boolean;
    error?: Error;
    delay?: number;
  }[];
}

export interface RetryStrategy {
  /**
   * Determines if a retry should occur based on the current context.
   * @param context The current state of the retry attempts.
   * @returns True if a retry should be attempted, false otherwise.
   */
  shouldRetry(context: RetryContext): boolean;

  /**
   * Calculates the delay before the next attempt.
   * @param context The current state of the retry attempts.
   * @returns The delay in milliseconds.
   */
  calculateDelay(context: RetryContext): number;

  /**
   * Updates the context with metadata about the current attempt.
   * @param context The context to update.
   * @param success Whether the last attempt was successful.
   * @param error The error encountered, if any.
   * @param delay The delay that was applied.
   */
  updateContext(context: RetryContext, success: boolean, error?: Error, delay?: number): void;
}

export class ContextualRetryManager {
  private strategies: RetryStrategy[];

  constructor(strategies: RetryStrategy[]) {
    this.strategies = strategies;
  }

  private getNextStrategy(context: RetryContext): RetryStrategy | undefined {
    // Simple approach: use the last strategy or the first one if context is new
    return this.strategies[Math.min(context.attemptCount, this.strategies.length - 1)];
  }

  public async execute<T>(
    action: () => Promise<T>,
    initialContext: RetryContext = {
      attemptCount: 0,
      lastError: null,
      history: [],
    }
  ): Promise<T> {
    let context: RetryContext = {
      attemptCount: 0,
      lastError: null,
      history: [],
    };

    while (true) {
      try {
        const result = await action();
        
        const nextStrategy = this.getNextStrategy(context);
        if (nextStrategy) {
          nextStrategy.updateContext(context, true);
        }
        
        return result;

      } catch (error) {
        const currentError = error as Error;
        context.lastError = currentError;
        
        const nextStrategy = this.getNextStrategy(context);

        if (!nextStrategy) {
          throw new Error("No retry strategies available.");
        }

        if (!nextStrategy.shouldRetry(context)) {
          throw new Error(`Operation failed permanently after ${context.attemptCount} attempts. Last error: ${currentError.message}`);
        }

        const delay = nextStrategy.calculateDelay(context);
        
        await setTimeout(delay);

        context.attemptCount += 1;
        nextStrategy.updateContext(context, false, currentError, delay);
      }
    }
  }
}