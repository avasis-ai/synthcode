import { EventEmitter } from "events";

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = "CLOSED";
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private options: CircuitBreakerOptions;

  constructor(options: CircuitBreakerOptions) {
    super();
    this.options = options;
  }

  private isCircuitOpen(currentTime: number): boolean {
    if (this.state === "OPEN") {
      const timeSinceFailure = currentTime - this.lastFailureTime;
      if (timeSinceFailure >= this.options.resetTimeoutMs) {
        this.transitionTo("HALF_OPEN");
        return false;
      }
      return true;
    }
    return false;
  }

  private transitionTo(newState: CircuitState): void {
    this.state = newState;
    this.emit("stateChange", newState);
  }

  public recordSuccess(): void {
    if (this.state === "OPEN") {
      // Should not happen if checkExecutionState is used correctly, but reset just in case.
      this.transitionTo("CLOSED");
    } else if (this.state === "HALF_OPEN") {
      this.transitionTo("CLOSED");
    }
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }

  public recordFailure(): void {
    const now = Date.now();
    this.lastFailureTime = now;

    if (this.state === "CLOSED") {
      this.failureCount++;
      if (this.failureCount >= this.options.failureThreshold) {
        this.transitionTo("OPEN");
      }
    } else if (this.state === "HALF_OPEN") {
      // Failure in HALF_OPEN immediately trips the circuit back to OPEN
      this.transitionTo("OPEN");
    }
    // If OPEN, we just update the time, but the state remains OPEN until timeout.
  }

  public checkExecutionState(): { allowed: boolean; reason: string } {
    const now = Date.now();

    if (this.state === "OPEN") {
      const timeSinceFailure = now - this.lastFailureTime;
      if (timeSinceFailure >= this.options.resetTimeoutMs) {
        this.transitionTo("HALF_OPEN");
        return { allowed: true, reason: "Circuit is half-open, attempting execution." };
      }
      const timeRemaining = this.options.resetTimeoutMs - timeSinceFailure;
      return { allowed: false, reason: `Circuit is open. Try again in ${Math.ceil(timeRemaining / 1000)} seconds.` };
    }

    if (this.state === "HALF_OPEN") {
      return { allowed: true, reason: "Circuit is half-open, allowing one test call." };
    }

    return { allowed: true, reason: "Circuit is closed, execution allowed." };
  }

  public execute<T>(
    fn: () => Promise<T>
  ): Promise<T> {
    const { allowed, reason } = this.checkExecutionState();

    if (!allowed) {
      return Promise.reject(new Error(`Circuit Breaker Open: ${reason}`));
    }

    return fn().catch((error) => {
      this.recordFailure();
      throw error;
    }).then((result) => {
      this.recordSuccess();
      return result;
    });
  }
}