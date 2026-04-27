import { setTimeout } from "timers/promises";

export interface RetryStrategy {
  initialDelayMs: number;
  maxAttempts: number;
  backoffFactor: number;
  jitterFactor: number;
  shouldRetry: (error: unknown, attempt: number) => boolean;
}

export interface ToolExecutionFunction<T> {
  (context: Record<string, unknown>): Promise<T>;
}

export class RetryManager<T> {
  private readonly strategy: RetryStrategy;
  private readonly toolExecution: ToolExecutionFunction<T>;

  constructor(strategy: RetryStrategy, toolExecution: ToolExecutionFunction<T>) {
    this.strategy = strategy;
    this.toolExecution = toolExecution;
  }

  private calculateDelay(attempt: number): Promise<void> {
    const { initialDelayMs, backoffFactor, jitterFactor } = this.strategy;
    if (attempt === 0) {
      return Promise.resolve();
    }

    let delay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
    
    const jitter = delay * jitterFactor * (Math.random() * 2 - 1);
    const finalDelay = Math.max(10, Math.round(delay + jitter));

    return setTimeout(finalDelay);
  }

  public async execute(context: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < this.strategy.maxAttempts; attempt++) {
      try {
        const result = await this.toolExecution(context);
        return result;
      } catch (error) {
        if (!this.strategy.shouldRetry(error, attempt) || attempt === this.strategy.maxAttempts - 1) {
          throw error;
        }
        
        await this.calculateDelay(attempt);
      }
    }
    throw new Error("Max retry attempts reached.");
  }
}