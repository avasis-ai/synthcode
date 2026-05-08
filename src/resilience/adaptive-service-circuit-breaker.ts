export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenSuccessThreshold: number;
  failureWindowMs: number;
}

export class ServiceCircuitBreaker {
  private state: CircuitState = "CLOSED";
  private options: CircuitBreakerOptions;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private consecutiveSuccesses: number = 0;

  constructor(options: CircuitBreakerOptions) {
    this.options = options;
  }

  private transitionTo(newState: CircuitState): void {
    this.state = newState;
  }

  private isCircuitOpen(currentTime: number): boolean {
    const timeSinceLastFailure = currentTime - this.lastFailureTime;
    return this.state === "OPEN" && timeSinceLastFailure > this.options.resetTimeoutMs;
  }

  private checkState(currentTime: number): "CLOSED" | "OPEN" | "HALF_OPEN" {
    if (this.state === "OPEN") {
      if (this.isCircuitOpen(currentTime)) {
        this.transitionTo("HALF_OPEN");
        return "HALF_OPEN";
      }
      return "OPEN";
    }
    return this.state;
  }

  public recordSuccess(): void {
    const now = Date.now();
    if (this.state === "HALF_OPEN") {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= this.options.halfOpenSuccessThreshold) {
        this.transitionTo("CLOSED");
        this.failureCount = 0;
        this.consecutiveSuccesses = 0;
      }
    } else if (this.state === "CLOSED") {
      this.failureCount = 0;
      this.consecutiveSuccesses = 0;
    }
  }

  public recordFailure(): void {
    const now = Date.now();
    this.lastFailureTime = now;

    if (this.state === "HALF_OPEN") {
      this.transitionTo("OPEN");
      this.consecutiveSuccesses = 0;
      return;
    }

    if (this.state === "CLOSED") {
      this.failureCount++;
      if (this.failureCount >= this.options.failureThreshold) {
        this.transitionTo("OPEN");
      }
    }
  }

  public getState(): CircuitState {
    return this.state;
  }

  public checkAndExecute<T>(
    execute: () => Promise<T>
  ): Promise<T> {
    const now = Date.now();
    const currentState = this.checkState(now);

    if (currentState === "OPEN") {
      throw new Error("Circuit is open. Service unavailable.");
    }

    return execute()
      .then(result => {
        this.recordSuccess();
        return result;
      })
      .catch(error => {
        this.recordFailure();
        throw error;
      });
  }
}

export { ServiceCircuitBreaker };