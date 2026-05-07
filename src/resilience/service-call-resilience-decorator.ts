import { Message } from "./types";

interface ServiceCallConfig {
  maxRetries: number;
  initialBackoffMs: number;
  circuitBreakerOptions?: {
    failureThreshold: number;
    resetTimeoutMs: number;
  };
}

class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;

  constructor(options: { failureThreshold: number; resetTimeoutMs: number }) {
    this.failureThreshold = options.failureThreshold;
    this.resetTimeoutMs = options.resetTimeoutMs;
  }

  canExecute(): boolean {
    if (this.failureCount >= this.failureThreshold) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.resetTimeoutMs) {
        this.failureCount = 0; // Half-open state
        return true;
      }
      return false; // Open state
    }
    return true; // Closed state
  }

  onSuccess() {
    this.failureCount = 0;
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }
}

class RetryManager {
  async execute<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    initialBackoffMs: number
  ): Promise<T> {
    let attempts = 0;
    while (attempts <= maxRetries) {
      try {
        return await fn();
      } catch (error) {
        attempts++;
        if (attempts > maxRetries) {
          throw error;
        }
        const delay = initialBackoffMs * Math.pow(2, attempts - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error("Exceeded maximum retries.");
  }
}

/**
 * Decorator function that wraps a service call with resilience logic.
 * Combines Circuit Breaker, Retry, and Exponential Backoff.
 * @param serviceFn The asynchronous function representing the service call.
 * @param config Configuration options for resilience.
 * @returns A wrapped, resilient function.
 */
export function withServiceResilience<T extends (...args: any[]) => Promise<any>>(
  serviceFn: T,
  config: ServiceCallConfig
): (...args: Parameters<T>) => Promise<any> {
  const retryManager = new RetryManager();
  const circuitBreaker = config.circuitBreakerOptions
    ? new CircuitBreaker(config.circuitBreakerOptions)
    : null;

  return async (...args) => {
    if (circuitBreaker && !circuitBreaker.canExecute()) {
      throw new Error("Circuit Breaker Open: Service call blocked due to excessive failures.");
    }

    const wrappedServiceCall = async (): Promise<any> => {
      try {
        const result = await serviceFn(...args);
        if (circuitBreaker) {
          circuitBreaker.onSuccess();
        }
        return result;
      } catch (error) {
        if (circuitBreaker) {
          circuitBreaker.onFailure();
        }
        throw error;
      }
    };

    try {
      const result = await retryManager.execute(
        wrappedServiceCall,
        config.maxRetries,
        config.initialBackoffMs
      );
      return result;
    } catch (error) {
      throw error;
    }
  };
}