import { describe, it, expect, vi } from "vitest";
import { RetryContext, RetryStrategy } from "../src/retry/contextual-retry-manager";
import { ContextualRetryManager } from "../src/retry/contextual-retry-manager";

describe("ContextualRetryManager", () => {
  it("should correctly determine if a retry is needed based on strategy and context", async () => {
    const mockStrategy: RetryStrategy = {
      shouldRetry: (context) => {
        if (context.attemptCount >= 3) return false;
        if (context.lastError instanceof Error && context.lastError.message.includes("fatal")) return false;
        return true;
      },
    };

    const manager = new ContextualRetryManager(mockStrategy);

    // Test case 1: Should retry when attempt count is low and error is not fatal
    const context1: RetryContext = {
      attemptCount: 1,
      lastError: new Error("transient error"),
      history: [{ attempt: 1, success: false, error: new Error("transient error") }],
    };
    expect(manager.shouldRetry(context1)).toBe(true);

    // Test case 2: Should NOT retry when attempt count is too high
    const context2: RetryContext = {
      attemptCount: 5,
      lastError: new Error("transient error"),
      history: [{ attempt: 1, success: false }],
    };
    expect(manager.shouldRetry(context2)).toBe(false);

    // Test case 3: Should NOT retry when the last error is marked as fatal
    const context3: RetryContext = {
      attemptCount: 2,
      lastError: new Error("fatal error"),
      history: [{ attempt: 1, success: false, error: new Error("transient error") }],
    };
    expect(manager.shouldRetry(context3)).toBe(false);
  });

  it("should update context correctly after a successful attempt", async () => {
    const mockStrategy: RetryStrategy = {
      shouldRetry: () => true,
    };
    const manager = new ContextualRetryManager(mockStrategy);

    const initialContext: RetryContext = {
      attemptCount: 1,
      lastError: new Error("initial error"),
      history: [{ attempt: 1, success: false, error: new Error("initial error") }],
    };

    const newContext = manager.updateContext(initialContext, true, undefined, 0);

    expect(newContext.attemptCount).toBe(2);
    expect(newContext.history).toHaveLength(2);
    expect(newContext.history[1].success).toBe(true);
    expect(newContext.lastError).toBeNull();
  });

  it("should update context correctly after a failed attempt", async () => {
    const mockStrategy: RetryStrategy = {
      shouldRetry: () => true,
    };
    const manager = new ContextualRetryManager(mockStrategy);

    const initialContext: RetryContext = {
      attemptCount: 1,
      lastError: new Error("initial error"),
      history: [{ attempt: 1, success: false, error: new Error("initial error") }],
    };
    const lastError = new Error("network failure");

    const newContext = manager.updateContext(initialContext, false, lastError, 100);

    expect(newContext.attemptCount).toBe(2);
    expect(newContext.history).toHaveLength(2);
    expect(newContext.history[1].success).toBe(false);
    expect(newContext.history[1].error).toBe(lastError);
    expect(newContext.lastError).toBe(lastError);
  });
});