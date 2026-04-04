import { describe, it, expect } from "vitest";
import { CircuitBreaker } from "../src/circuit-breaker";

describe("CircuitBreaker", () => {
  it("should start in the CLOSED state", () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 100 });
    expect(cb["state"]).toBe("CLOSED");
  });

  it("should transition to OPEN after exceeding failure threshold", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 100 });
    // Simulate failures until OPEN
    await cb["recordFailure"]();
    await cb["recordFailure"]();
    expect(cb["state"]).toBe("OPEN");
  });

  it("should transition to HALF_OPEN after reset timeout and allow one test call", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 50 });
    // Force OPEN state (simulating enough failures)
    await cb["recordFailure"]();
    await cb["recordFailure"]();
    expect(cb["state"]).toBe("OPEN");

    // Wait for timeout to transition to HALF_OPEN
    jest.useFakeTimers();
    jest.advanceTimersByTime(51);
    await Promise.resolve(); // Allow state change event to process
    expect(cb["state"]).toBe("HALF_OPEN");
  });
});