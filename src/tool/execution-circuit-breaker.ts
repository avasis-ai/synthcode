import { EventEmitter } from "node:events";

type CircuitState = "CLOSED" | "OPEN" | "HALF-OPEN";

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}

export class ToolExecutionCircuitBreaker extends EventEmitter {
  private readonly options: CircuitBreakerOptions;
  private state: CircuitState = "CLOSED";
  private failureCount: number = 0;
  private lastFailureTime: number = 0;

  constructor(options: CircuitBreakerOptions) {
    super();
    this.options = options;
  }

  private isCircuitOpen(currentTime: number): boolean {
    if (this.state === "OPEN") {
      const timeSinceFailure = currentTime - this.lastFailureTime;
      if (timeSinceFailure > this.options.resetTimeoutMs) {
        this.transitionTo("HALF-OPEN");
        return false;
      }
      return true;
    }
    return false;
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state === newState) return;
    this.state = newState;
    console.log(`Circuit Breaker transitioned to: ${newState}`);
    this.emit("stateChange", newState);
  }

  private recordFailure(): void {
    const now = Date.now();
    this.failureCount += 1;
    this.lastFailureTime = now;

    if (this.state === "CLOSED" && this.failureCount >= this.options.failureThreshold) {
      this.transitionTo("OPEN");
    } else if (this.state === "HALF-OPEN") {
      this.transitionTo("OPEN");
    }
  }

  private recordSuccess(): void {
    if (this.state !== "CLOSED") {
      this.transitionTo("CLOSED");
    }
    this.failureCount = 0;
  }

  public async execute<T>(
    toolCall: () => Promise<T>
  ): Promise<T> {
    const now = Date.now();

    if (this.isCircuitOpen(now)) {
      throw new Error("CircuitBreakerOpenError: Tool execution is temporarily disabled due to high failure rate.");
    }

    try {
      const result = await toolCall();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  public getState(): CircuitState {
    return this.state;
  }
}