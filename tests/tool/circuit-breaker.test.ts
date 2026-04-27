import { describe, it, expect, vi } from "vitest";
import { CircuitBreaker } from "../src/tool/circuit-breaker";

describe("CircuitBreaker", () => {
    it("should start in CLOSED state and allow calls", () => {
        const breaker = new CircuitBreaker(3, 100, 2);
        expect(breaker.getState()).toBe("CLOSED");
        // Simulate a successful call
        breaker.recordSuccess();
        expect(breaker.getState()).toBe("CLOSED");
    });

    it("should transition to OPEN after exceeding failure threshold", () => {
        // Failure threshold of 2, reset timeout of 100ms, success threshold of 1
        const breaker = new CircuitBreaker(2, 100, 1);
        
        // Fail 1
        breaker.recordFailure();
        expect(breaker.getState()).toBe("CLOSED");

        // Fail 2 (should trip)
        breaker.recordFailure();
        expect(breaker.getState()).toBe("OPEN");
    });

    it("should transition to HALF-OPEN after timeout and allow one test call", async () => {
        // Failure threshold of 1, reset timeout of 10ms, success threshold of 1
        const breaker = new CircuitBreaker(1, 10, 1);

        // Trip to OPEN
        breaker.recordFailure();
        expect(breaker.getState()).toBe("OPEN");

        // Wait for timeout to transition to HALF-OPEN
        await new Promise(resolve => setTimeout(resolve, 11));
        expect(breaker.getState()).toBe("HALF-OPEN");

        // Simulate a successful call in HALF-OPEN state
        breaker.recordSuccess();
        expect(breaker.getState()).toBe("CLOSED");
    });
});