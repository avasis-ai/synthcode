import { describe, it, expect, vi } from "vitest";
import { ToolExecutionCircuitBreaker } from "../src/tool/execution-circuit-breaker";

describe("ToolExecutionCircuitBreaker", () => {
  it("should initialize in CLOSED state", () => {
    const options = { failureThreshold: 3, resetTimeoutMs: 1000 };
    const breaker = new ToolExecutionCircuitBreaker(options);
    expect(breaker["state"]).toBe("CLOSED");
  });

  it("should transition to OPEN after exceeding failure threshold", async () => {
    const options = { failureThreshold: 2, resetTimeoutMs: 100 };
    const breaker = new ToolExecutionCircuitBreaker(options);

    // Simulate failures until OPEN
    await breaker.recordFailure();
    await breaker.recordFailure();
    expect(breaker["state"]).toBe("OPEN");
  });

  it("should transition to HALF-OPEN after reset timeout and allow one test call", async () => {
    const options = { failureThreshold: 1, resetTimeoutMs: 50 };
    const breaker = new ToolExecutionCircuitBreaker(options);

    // Force OPEN state (1 failure)
    await breaker.recordFailure();
    expect(breaker["state"]).toBe("OPEN");

    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 60));

    // Should be HALF-OPEN after timeout
    expect(breaker["state"]).toBe("HALF-OPEN");

    // Simulate success in HALF-OPEN state (should close)
    await breaker.recordSuccess();
    expect(breaker["state"]).toBe("CLOSED");
  });
});