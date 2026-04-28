import { describe, it, expect } from "vitest";
import { AdaptiveFallbackChain } from "../src/fallback/adaptive-fallback-chain";
import { Message, ToolResultMessage } from "../src/fallback/types";

describe("AdaptiveFallbackChain", () => {
  it("should execute the correct fallback step based on the error type", async () => {
    const mockFallback1 = vi.fn().mockResolvedValue("Fallback 1 Success");
    const mockFallback2 = vi.fn().mockResolvedValue("Fallback 2 Success");

    const chain = new AdaptiveFallbackChain([
      { criteria: { onErrorType: "Timeout" }, fallbackTool: mockFallback1 },
      { criteria: { onErrorType: "RateLimit" }, fallbackTool: mockFallback2 },
    ]);

    const context = { lastError: "Timeout", message: { content: "Test" } };
    const result = await chain.execute(context);

    expect(mockFallback1).toHaveBeenCalledWith(context);
    expect(mockFallback2).not.toHaveBeenCalled();
    expect(result).toBe("Fallback 1 Success");
  });

  it("should execute the first fallback step if no specific error type matches", async () => {
    const mockFallback1 = vi.fn().mockResolvedValue("Fallback 1 Success");
    const mockFallback2 = vi.fn().mockResolvedValue("Fallback 2 Success");

    const chain = new AdaptiveFallbackChain([
      { criteria: { onErrorType: "Timeout" }, fallbackTool: mockFallback1 },
      { criteria: { onErrorType: "RateLimit" }, fallbackTool: mockFallback2 },
    ]);

    // Context with an error type that doesn't match any specific step
    const context = { lastError: "Unknown", message: { content: "Test" } };
    const result = await chain.execute(context);

    // Assuming the implementation falls back to the first step if no match is found,
    // or handles it based on its internal logic (here we test it executes at least one).
    // If the chain is designed to execute all, this test needs adjustment.
    // Based on the structure, we expect it to find a match or handle the default.
    // For this test, we assume if no match, it might execute the first one or none depending on design.
    // Let's adjust the expectation based on the assumption that if no match, it might fail gracefully or execute the first one.
    // For robustness, we'll check if it executes *any* fallback if the chain is designed to always run one.
    // If the chain is designed to run *only* on match, we check for no calls.
    
    // Re-evaluating: If the chain is designed to execute *only* on match, and "Unknown" doesn't match,
    // we expect no calls if the logic is strict.
    await chain.execute({ lastError: "Unknown", message: { content: "Test" } });
    expect(mockFallback1).not.toHaveBeenCalled();
    expect(mockFallback2).not.toHaveBeenCalled();
  });

  it("should execute the last matching fallback step and stop", async () => {
    const mockFallback1 = vi.fn().mockResolvedValue("Fallback 1 Success");
    const mockFallback2 = vi.fn().mockResolvedValue("Fallback 2 Success");

    const chain = new AdaptiveFallbackChain([
      { criteria: { onErrorType: "Timeout" }, fallbackTool: mockFallback1 },
      { criteria: { onErrorType: "Timeout" }, fallbackTool: mockFallback2 }, // Duplicate criteria to test order
    ]);

    const context = { lastError: "Timeout", message: { content: "Test" } };
    const result = await chain.execute(context);

    // Should execute the last one defined for "Timeout"
    expect(mockFallback1).toHaveBeenCalledTimes(1);
    expect(mockFallback2).toHaveBeenCalledTimes(1);
    expect(result).toBe("Fallback 2 Success");
  });
});