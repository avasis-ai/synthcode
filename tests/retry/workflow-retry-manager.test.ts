import { describe, it, expect, vi } from "vitest";
import { WorkflowRetryManager } from "../src/retry/workflow-retry-manager";

describe("WorkflowRetryManager", () => {
  it("should initialize correctly with a maximum retry count", () => {
    const maxRetries = 3;
    const manager = new WorkflowRetryManager(maxRetries);
    expect(manager.maxRetries).toBe(maxRetries);
  });

  it("should increment retry count and throw an error when max retries are exceeded", async () => {
    const maxRetries = 2;
    const manager = new WorkflowRetryManager(maxRetries);
    const mockError = new Error("Rate limit exceeded");

    // Attempt 1 (Success)
    await manager.attempt(mockError);
    expect(manager.currentAttempt).toBe(1);

    // Attempt 2 (Success)
    await manager.attempt(mockError);
    expect(manager.currentAttempt).toBe(2);

    // Attempt 3 (Failure - should throw)
    await expect(manager.attempt(mockError)).rejects.toThrow("Maximum retries exceeded");
    expect(manager.currentAttempt).toBe(3); // Should track the failed attempt
  });

  it("should reset the retry count when explicitly reset", async () => {
    const manager = new WorkflowRetryManager(5);
    const mockError = new Error("Transient failure");

    // Simulate some attempts
    await manager.attempt(mockError);
    await manager.attempt(mockError);
    expect(manager.currentAttempt).toBe(2);

    // Reset
    manager.reset();
    expect(manager.currentAttempt).toBe(0);

    // Attempt again
    await manager.attempt(mockError);
    expect(manager.currentAttempt).toBe(1);
  });
});