import { describe, it, expect, vi, beforeEach } from "vitest";
import { ServiceCircuitBreaker, CircuitBreakerOptions } from "../src/resilience/adaptive-service-circuit-breaker";

describe("ServiceCircuitBreaker", () => {
  let circuitBreaker: ServiceCircuitBreaker;
  const mockOptions: CircuitBreakerOptions = {
    failureThreshold: 3,
    resetTimeoutMs: 100,
    halfOpenSuccessThreshold: 2,
    failureWindowMs: 500,
  };

  beforeEach(() => {
    // Reset the circuit breaker before each test
    circuitBreaker = new ServiceCircuitBreaker(mockOptions);
    vi.useFakeTimers();
  });

  it("should transition from CLOSED to OPEN after exceeding failure threshold", async () => {
    // Arrange: Simulate failures
    const mockServiceCall = vi.spyOn(circuitBreaker, "callService").mockRejectedValue(new Error("Service failed"));

    // 1. Failure 1 (State: CLOSED)
    await circuitBreaker.execute(() => mockServiceCall());
    expect(circuitBreaker.getState()).toBe("CLOSED");

    // 2. Failure 2 (State: CLOSED)
    await circuitBreaker.execute(() => mockServiceCall());
    expect(circuitBreaker.getState()).toBe("CLOSED");

    // 3. Failure 3 (State: OPEN) - Exceeds failureThreshold (3)
    await circuitBreaker.execute(() => mockServiceCall());
    expect(circuitBreaker.getState()).toBe("OPEN");
  });

  it("should remain OPEN and reject calls until resetTimeoutMs passes", async () => {
    // Force the circuit to OPEN state first
    const mockServiceCall = vi.spyOn(circuitBreaker, "callService").mockRejectedValue(new Error("Service failed"));
    await circuitBreaker.execute(() => mockServiceCall()); // Failure 1
    await circuitBreaker.execute(() => mockServiceCall()); // Failure 2
    await circuitBreaker.execute(() => mockServiceCall()); // Failure 3 -> OPEN

    expect(circuitBreaker.getState()).toBe("OPEN");

    // Attempt call while OPEN - should fail immediately
    await expect(circuitBreaker.execute(() => mockServiceCall())).rejects.toThrow("Circuit is open");
    
    // Advance time but not enough
    vi.advanceTimersByTime(mockOptions.resetTimeoutMs - 1);
    await Promise.resolve();
    expect(circuitBreaker.getState()).toBe("OPEN");

    // Advance time past the timeout
    vi.advanceTimersByTime(1);
    await Promise.resolve();
    expect(circuitBreaker.getState()).toBe("HALF_OPEN");
  });

  it("should transition from HALF_OPEN to CLOSED upon sufficient successes", async () => {
    // 1. Force the circuit to OPEN state first
    const mockServiceCall = vi.spyOn(circuitBreaker, "callService").mockRejectedValue(new Error("Service failed"));
    await circuitBreaker.execute(() => mockServiceCall());
    await circuitBreaker.execute(() => mockServiceCall());
    await circuitBreaker.execute(() => mockServiceCall()); // OPEN

    // 2. Wait for timeout to reach HALF_OPEN
    vi.advanceTimersByTime(mockOptions.resetTimeoutMs);
    await Promise.resolve();
    expect(circuitBreaker.getState()).toBe("HALF_OPEN");

    // 3. Simulate success 1 (State: HALF_OPEN)
    vi.spyOn(circuitBreaker, "callService").mockResolvedValue("Success");
    await circuitBreaker.execute(() => vi.spyOn(circuitBreaker, "callService")());
    expect(circuitBreaker.getState()).toBe("HALF_OPEN");

    // 4. Simulate success 2 (State: HALF_OPEN)
    await circuitBreaker.execute(() => vi.spyOn(circuitBreaker, "callService")());
    expect(circuitBreaker.getState()).toBe("HALF_OPEN");

    // 5. Simulate success 3 (State: CLOSED) - Exceeds halfOpenSuccessThreshold (2)
    // Note: The implementation should transition to CLOSED after the Nth success.
    await circuitBreaker.execute(() => vi.spyOn(circuitBreaker, "callService")());
    expect(circuitBreaker.getState()).toBe("CLOSED");
  });
});