import { describe, it, expect } from "vitest";
import { validateToolCallGraph } from "../src/validation/contextual-tool-call-validator-v160-advanced-advanced";

describe("validateToolCallGraph", () => {
  it("should return true for a simple, valid tool call graph", () => {
    const validGraph = {
      nodes: [
        {
          toolUseId: "tool1",
          toolName: "search",
          input: { query: "test" },
          dependencies: new Set<string>(["tool2"]),
          conflicts: new Set<string>(),
        },
        {
          toolUseId: "tool2",
          toolName: "get_weather",
          input: { location: "London" },
          dependencies: new Set<string>(),
          conflicts: new Set<string>(),
        },
      ],
    };
    const result = validateToolCallGraph(validGraph);
    expect(result.isValid).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });

  it("should detect a dependency cycle", () => {
    const cyclicGraph = {
      nodes: [
        {
          toolUseId: "toolA",
          toolName: "toolA",
          input: {},
          dependencies: new Set<string>(["toolB"]),
          conflicts: new Set<string>(),
        },
        {
          toolUseId: "toolB",
          toolName: "toolB",
          input: {},
          dependencies: new Set<string>(["toolA"]),
          conflicts: new Set<string>(),
        },
      ],
    };
    const result = validateToolCallGraph(cyclicGraph);
    expect(result.isValid).toBe(false);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].type).toBe("DependencyCycle");
  });

  it("should detect resource contention conflicts", () => {
    const conflictingGraph = {
      nodes: [
        {
          toolUseId: "tool1",
          toolName: "search",
          input: { query: "data" },
          dependencies: new Set<string>(),
          conflicts: new Set<string>(["tool2"]),
        },
        {
          toolUseId: "tool2",
          toolName: "search",
          input: { query: "data" },
          dependencies: new Set<string>(),
          conflicts: new Set<string>(["tool1"]),
        },
      ],
    };
    const result = validateToolCallGraph(conflictingGraph);
    expect(result.isValid).toBe(false);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].type).toBe("ResourceContention");
  });
});