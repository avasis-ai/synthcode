import { describe, it, expect } from "vitest";
import { AdvancedToolCallContext } from "../src/validation/contextual-tool-call-validator-advanced-advanced";

describe("AdvancedToolCallContext", () => {
  it("should correctly initialize with empty constraints", () => {
    const context: AdvancedToolCallContext = {
      history: [],
      currentResources: new Map(),
      resourceConstraints: [],
      temporalConstraints: [],
      lastToolCallOutput: null,
    };
    expect(context.history).toEqual([]);
    expect(context.currentResources.size).toBe(0);
    expect(context.resourceConstraints).toEqual([]);
    expect(context.temporalConstraints).toEqual([]);
    expect(context.lastToolCallOutput).toBeNull();
  });

  it("should handle existing resource constraints", () => {
    const context: AdvancedToolCallContext = {
      history: [],
      currentResources: new Map([["cpu", 10]]),
      resourceConstraints: [
        { resourceName: "memory", requiredAmount: 5, availableAmount: 10 },
        { resourceName: "gpu", requiredAmount: 1, availableAmount: 1 },
      ],
      temporalConstraints: [],
      lastToolCallOutput: null,
    };
    expect(context.resourceConstraints.length).toBe(2);
    expect(context.resourceConstraints[0].resourceName).toBe("memory");
    expect(context.currentResources.get("cpu")).toBe(10);
  });

  it("should correctly store a last tool call output", () => {
    const mockOutput = { toolName: "search", result: "Search results found." };
    const context: AdvancedToolCallContext = {
      history: [{ role: "user", content: "Search for X" }],
      currentResources: new Map(),
      resourceConstraints: [],
      temporalConstraints: [],
      lastToolCallOutput: mockOutput,
    };
    expect(context.lastToolCallOutput).toEqual(mockOutput);
  });
});