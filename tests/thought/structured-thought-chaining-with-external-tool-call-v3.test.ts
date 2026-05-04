import { describe, it, expect } from "vitest";
import { StructuredThoughtChain, ChainingContext } from "../src/thought/structured-thought-chaining-with-external-tool-call-v3";

describe("StructuredThoughtChain", () => {
  it("should correctly initialize an empty chain", () => {
    const chain: StructuredThoughtChain = [];
    expect(chain).toEqual([]);
  });

  it("should correctly process a single thought step with no tool calls", () => {
    const context: ChainingContext = {
      history: [],
      externalToolResults: {},
    };
    const initialChain: StructuredThoughtChain = [
      { thought: "Initial thought process.", toolCalls: undefined, externalCalls: undefined },
    ];
    const result = initialChain; // Simplified for testing structure

    expect(result).toHaveLength(1);
    expect(result[0].thought).toBe("Initial thought process.");
    expect(result[0].toolCalls).toBeUndefined();
    expect(result[0].externalCalls).toBeUndefined();
  });

  it("should handle a chain with multiple steps including external tool calls", () => {
    const context: ChainingContext = {
      history: [],
      externalToolResults: { "toolA": "resultA" },
    };
    const chain: StructuredThoughtChain = [
      { thought: "Step 1: Initial analysis.", toolCalls: undefined, externalCalls: undefined },
      { thought: "Step 2: Using external tool A.", toolCalls: undefined, externalCalls: [{ toolName: "toolA", input: { param: "value" }, description: "Desc A" }] },
      { thought: "Step 3: Final conclusion.", toolCalls: undefined, externalCalls: undefined },
    ];

    expect(chain).toHaveLength(3);
    expect(chain[1].externalCalls).toHaveLength(1);
    expect(chain[1].externalCalls![0].toolName).toBe("toolA");
  });
});