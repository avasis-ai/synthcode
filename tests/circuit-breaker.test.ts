import { describe, it, expect, vi } from "vitest";
import { CircuitBreaker } from "../src/circuit-breaker";

describe("CircuitBreaker", () => {
  it("should start in the CLOSED state", () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 100 });
    expect(cb["state"]).toBe("CLOSED");
  });

  it("should transition to OPEN after exceeding failure threshold", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 100 });
    await cb["recordFailure"]();
    await cb["recordFailure"]();
    expect(cb["state"]).toBe("OPEN");
  });

  it("should transition to HALF_OPEN after reset timeout and allow one test call", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 10 });
    await cb["recordFailure"]();
    await cb["recordFailure"]();
    expect(cb["state"]).toBe("OPEN");

    await new Promise((r) => setTimeout(r, 50));
    const result = cb.checkExecutionState();
    expect(result.allowed).toBe(true);
    expect(cb["state"]).toBe("HALF_OPEN");
  });
});