import { describe, it, expect, vi } from "vitest";
import { RetryManager } from "../src/tool/retry-manager";

describe("RetryManager", () => {
  it("should execute the tool execution function with the correct number of attempts", async () => {
    const mockTool = vi.fn()
      .mockRejectedValueOnce(new Error("Failed"))
      .mockResolvedValue("Success");

    const strategy = {
      initialDelayMs: 10,
      maxAttempts: 3,
      backoffFactor: 2,
      jitterFactor: 0.1,
      shouldRetry: (error, attempt) => attempt < 3,
    };

    const manager = new RetryManager(strategy, mockTool);
    await manager.execute(mockTool, {});

    expect(mockTool).toHaveBeenCalledTimes(3);
  });

  it("should stop retrying when the shouldRetry condition returns false", async () => {
    const mockTool = vi.fn()
      .mockRejectedValueOnce(new Error("Failed"))
      .mockRejectedValueOnce(new Error("Failed"))
      .mockResolvedValue("Success");

    const strategy = {
      initialDelayMs: 10,
      maxAttempts: 3,
      backoffFactor: 2,
      jitterFactor: 0.1,
      shouldRetry: (error, attempt) => attempt < 2, // Only retry on attempt 1
    };

    const manager = new RetryManager(strategy, mockTool);
    await manager.execute(mockTool, {});

    expect(mockTool).toHaveBeenCalledTimes(3);
  });

  it("should throw the last encountered error if all attempts fail", async () => {
    const mockTool = vi.fn()
      .mockRejectedValue(new Error("Fatal Error"));

    const strategy = {
      initialDelayMs: 10,
      maxAttempts: 3,
      backoffFactor: 2,
      jitterFactor: 0.1,
      shouldRetry: (error, attempt) => true,
    };

    const manager = new RetryManager(strategy, mockTool);
    await expect(manager.execute(mockTool, {})).rejects.toThrow("Fatal Error");
    expect(mockTool).toHaveBeenCalledTimes(3);
  });
});