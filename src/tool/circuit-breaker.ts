import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

type CircuitState = "CLOSED" | "OPEN" | "HALF-OPEN";

export class CircuitBreaker {
    private readonly failureThreshold: number;
    private readonly resetTimeoutMs: number;
    private readonly successThreshold: number;

    private failureCount: number = 0;
    private successCount: number = 0;
    private lastFailureTime: number = 0;
    private currentState: CircuitState = "CLOSED";

    constructor(failureThreshold: number = 3, resetTimeoutMs: number = 5000, successThreshold: number = 2) {
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
        this.successThreshold = successThreshold;
    }

    private checkStateTransition(): void {
        if (this.currentState === "OPEN" && Date.now() > this.lastFailureTime + this.resetTimeoutMs) {
            this.currentState = "HALF-OPEN";
            console.log("Circuit Breaker: Transitioned to HALF-OPEN.");
        } else if (this.currentState === "OPEN") {
            console.log("Circuit Breaker: Still OPEN. Skipping execution.");
        }
    }

    public recordSuccess(): void {
        if (this.currentState === "OPEN") {
            return;
        }

        this.successCount++;
        this.failureCount = 0;

        if (this.currentState === "HALF-OPEN" && this.successCount >= this.successThreshold) {
            this.currentState = "CLOSED";
            this.successCount = 0;
            console.log("Circuit Breaker: Transitioned to CLOSED after successful test calls.");
        } else if (this.currentState === "CLOSED") {
            // Optionally reset success count on sustained success in closed state
            this.successCount = 0;
        }
    }

    public recordFailure(): void {
        this.lastFailureTime = Date.now();
        this.failureCount++;
        this.successCount = 0;

        if (this.currentState === "HALF-OPEN") {
            this.currentState = "OPEN";
            this.failureCount = 1; // Reset failure count logic for clarity on immediate failure
            console.log("Circuit Breaker: Transitioned to OPEN after failure in HALF-OPEN.");
        } else if (this.currentState === "CLOSED" && this.failureCount >= this.failureThreshold) {
            this.currentState = "OPEN";
            console.log(`Circuit Breaker: Transitioned to OPEN due to ${this.failureThreshold} consecutive failures.`);
        }
    }

    public getState(): CircuitState {
        this.checkStateTransition();
        return this.currentState;
    }

    public isClosed(): boolean {
        return this.currentState === "CLOSED";
    }

    public isHalfOpen(): boolean {
        return this.currentState === "HALF-OPEN";
    }

    public isOpen(): boolean {
        return this.currentState === "OPEN";
    }
}

export type ToolExecutionCircuitBreaker = {
    breaker: CircuitBreaker;
    toolId: string;
};

export const createCircuitBreaker = (toolId: string): ToolExecutionCircuitBreaker => {
    return {
        breaker: new CircuitBreaker(),
        toolId: toolId,
    };
};

export const executeWithCircuitBreaker = async <T>(
    breaker: ToolExecutionCircuitBreaker,
    executionFn: () => Promise<T>
): Promise<T> => {
    const state = breaker.breaker.getState();

    if (state === "OPEN") {
        throw new Error(`Circuit Breaker for tool ${breaker.toolId} is OPEN. Service unavailable.`);
    }

    try {
        const result = await executionFn();

        breaker.breaker.recordSuccess();
        return result;
    } catch (error) {
        breaker.breaker.recordFailure();
        throw error;
    }
}