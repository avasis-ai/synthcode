import { describe, it, expect, vi } from "vitest";
import { ServiceCallScheduler } from "../src/scheduling/service-call-scheduler";

describe("ServiceCallScheduler", () => {
  vi.useFakeTimers();

  it("should initialize correctly and calculate initial wait time", () => {
    const config = { rateLimitPerSecond: 5, minDelayMs: 100 };
    const scheduler = new ServiceCallScheduler(config);

    // Mock Date.now() to ensure predictable timing
    vi.setSystemTime(new Date(2023, 0, 1, 12, 0, 0));
    
    // The scheduler should calculate a wait time based on rate limit and current time
    // Since it's the first call, the wait time should be minimal or based on minDelayMs
    const waitTime = scheduler["calculateWaitTime"]();
    expect(waitTime).toBeGreaterThanOrEqual(0);
  });

  it("should enforce rate limiting when calls are made rapidly", () => {
    const config = { rateLimitPerSecond: 2, minDelayMs: 50 };
    const scheduler = new ServiceCallScheduler(config);

    // Simulate the first call
    vi.setSystemTime(new Date(2023, 0, 1, 12, 0, 0));
    scheduler["scheduleCall"]();

    // Simulate a second call immediately (should be rate-limited)
    vi.setSystemTime(new Date(2023, 0, 1, 12, 0, 1)); // 1 second later
    const waitTime2 = scheduler["calculateWaitTime"]();
    
    // Rate limit for 2 calls per second means minimum interval is 1000ms / 2 = 500ms
    // Since 1 second passed, the wait time should be close to the calculated minimum interval
    expect(waitTime2).toBeGreaterThanOrEqual(400); // Allowing for minor floating point differences

    // Simulate a third call, which should also be rate-limited
    vi.setSystemTime(new Date(2023, 0, 1, 12, 0, 2)); // 2 seconds later
    const waitTime3 = scheduler["calculateWaitTime"]();
    expect(waitTime3).toBeGreaterThanOrEqual(400);
  });

  it("should respect minDelayMs even if rate limit allows faster calls", () => {
    const config = { rateLimitPerSecond: 10, minDelayMs: 200 };
    const scheduler = new ServiceCallScheduler(config);

    // Simulate the first call
    vi.setSystemTime(new Date(2023, 0, 1, 12, 0, 0));
    scheduler["scheduleCall"]();

    // Simulate a second call after only 100ms (rate limit allows it, but minDelayMs should enforce 200ms)
    vi.setSystemTime(new Date(2023, 0, 1, 12, 0, 0, 100));
    const waitTime = scheduler["calculateWaitTime"]();

    // The wait time should be dictated by minDelayMs (200ms)
    expect(waitTime).toBeCloseTo(200, 50);
  });
});