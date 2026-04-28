import { describe, it, expect } from "vitest";
import { AdaptiveToolFallbackChain, FallbackCondition, FallbackStep } from "../src/fallback/adaptive-tool-fallback-chain";

describe("AdaptiveToolFallbackChain", () => {
  it("should execute the primary tool if no fallback condition is met", async () => {
    const mockTool = {
      execute: async () => "success",
    };
    const mockCondition: FallbackCondition = {
      shouldFallback: () => false,
    };
    const chain = new AdaptiveToolFallbackChain([
      { tool: mockTool, condition: mockCondition },
    ]);

    const result = await chain.run();
    expect(result).toBe("success");
  });

  it("should execute the first fallback tool if the primary tool fails and the condition is met", async () => {
    const mockPrimaryTool = {
      execute: async () => {
        throw new Error("Primary failed");
      },
    };
    const mockFallbackTool = {
      execute: async () => "fallback_success",
    };
    const mockCondition: FallbackCondition = {
      shouldFallback: () => true,
    };
    const chain = new AdaptiveToolFallbackChain([
      { tool: mockPrimaryTool, condition: mockCondition },
      { tool: mockFallbackTool, condition: { shouldFallback: () => false } },
    ]);

    const result = await chain.run();
    expect(result).toBe("fallback_success");
  });

  it("should stop execution if all tools fail or no fallback condition is met", async () => {
    const mockTool = {
      execute: async () => {
        throw new Error("Tool failed");
      },
    };
    const mockCondition: FallbackCondition = {
      shouldFallback: () => true,
    };
    const chain = new AdaptiveToolFallbackChain([
      { tool: mockTool, condition: mockCondition },
      { tool: mockTool, condition: { shouldFallback: () => false } },
    ]);

    // We expect the last executed tool's error or a specific failure indicator
    await expect(chain.run()).rejects.toThrow("Tool failed");
  });
});