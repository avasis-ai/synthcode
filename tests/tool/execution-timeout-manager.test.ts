import { describe, it, expect } from "vitest";
import { ToolExecutionTimeoutManager } from "../src/tool/execution-timeout-manager";

describe("ToolExecutionTimeoutManager", () => {
  it("should return the timeout result when the execution times out", async () => {
    const mockFallback: any = async () => "fallback";
    const manager = new ToolExecutionTimeoutManager(10, mockFallback);

    const promise = Promise.reject(new Error("Timeout"));
    const result = await manager.execute(promise);

    expect(result.timedOut).toBe(true);
    expect(result.result).toBe("fallback");
    expect(result.fallbackExecuted).toBe(true);
  });

  it("should return the actual result when execution completes within the timeout", async () => {
    const mockFallback: any = async () => "fallback";
    const manager = new ToolExecutionTimeoutManager(100, mockFallback);

    const successfulPromise = Promise.resolve("success");
    const result = await manager.execute(successfulPromise);

    expect(result.timedOut).toBe(false);
    expect(result.result).toBe("success");
    expect(result.fallbackExecuted).toBe(false);
  });

  it("should handle errors during execution without triggering fallback if the error is not a timeout", async () => {
    const mockFallback: any = async () => "fallback";
    const manager = new ToolExecutionTimeoutManager(10, mockFallback);

    const failingPromise = Promise.reject(new Error("Execution failed"));
    const result = await manager.execute(failingPromise);

    expect(result.timedOut).toBe(false);
    expect(result.result).toBeNull();
    expect(result.fallbackExecuted).toBe(false);
  });
});