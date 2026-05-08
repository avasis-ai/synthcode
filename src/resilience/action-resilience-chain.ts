import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ActionFunction<T, R> = (context: Record<string, unknown>) => Promise<R | T>;

interface RetryStrategy {
  maxAttempts: number;
  initialDelayMs: number;
  backoffFactor: number;
}

interface FallbackAction<T> {
  execute: (context: Record<string, unknown>) => Promise<T>;
}

export class ActionResilienceChain<T> {
  private primaryAction: ActionFunction<Record<string, unknown>, T>;
  private retryStrategy: RetryStrategy;
  private fallbackActions: FallbackAction<T>[];

  constructor(
    primaryAction: ActionFunction<Record<string, unknown>, T>,
    retryStrategy: RetryStrategy,
    fallbackActions: FallbackAction<T>[] = []
  ) {
    this.primaryAction = primaryAction;
    this.retryStrategy = retryStrategy;
    this.fallbackActions = fallbackActions;
  }

  private async executeWithRetry(context: Record<string, unknown>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryStrategy.maxAttempts; attempt++) {
      try {
        return await this.primaryAction(context);
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        if (attempt < this.retryStrategy.maxAttempts) {
          const delay = this.retryStrategy.initialDelayMs * Math.pow(
            this.retryStrategy.backoffFactor,
            attempt - 1
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw lastError;
        }
      }
    }
    throw lastError!;
  }

  private async executeFallback(context: Record<string, unknown>): Promise<T> {
    if (this.fallbackActions.length === 0) {
      throw new Error("No fallback actions defined.");
    }

    for (const fallback of this.fallbackActions) {
      try {
        return await fallback.execute(context);
      } catch (e) {
        console.warn("Fallback action failed, attempting next fallback.", e);
      }
    }
    throw new Error("All fallback actions failed.");
  }

  /**
   * Executes the primary action, applying retries, and falling back if all attempts fail.
   * @param context The execution context containing necessary data.
   * @returns The result of the successful execution path.
   */
  public async execute(context: Record<string, unknown>): Promise<T> {
    try {
      return await this.executeWithRetry(context);
    } catch (e) {
      console.error("Primary action failed after all retries. Initiating fallback sequence.", e);
      return await this.executeFallback(context);
    }
  }
}