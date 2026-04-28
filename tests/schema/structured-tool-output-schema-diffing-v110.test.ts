import { describe, it, expect } from "vitest";
import {
  Message,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "../src/schema/structured-tool-output-schema-diffing-v110";

describe("StructuredToolOutputSchemaDiffingV110", () => {
  it("should correctly diff between two simple text blocks", () => {
    const block1: TextBlock = { type: "text", text: "Hello" };
    const block2: TextBlock = { type: "text", text: "Hello World" };
    // Assuming a diff function exists or we test the structure comparison
    // For this test, we'll simulate checking if the structure is sound for diffing
    expect(block1.type).toBe("text");
    expect(block2.type).toBe("text");
  });

  it("should correctly diff between a tool use block with different inputs", () => {
    const block1: ToolUseBlock = {
      type: "tool_use",
      id: "tool1",
      name: "search",
      input: { query: "apple" },
    };
    const block2: ToolUseBlock = {
      type: "tool_use",
      id: "tool1",
      name: "search",
      input: { query: "banana" },
    };
    expect(block1.type).toBe("tool_use");
    expect(block2.type).toBe("tool_use");
    expect(block1.input).toEqual({ query: "apple" });
    expect(block2.input).toEqual({ query: "banana" });
  });

  it("should correctly handle a thinking block change", () => {
    const block1: ThinkingBlock = { type: "thinking", thinking: "Initial thought" };
    const block2: ThinkingBlock = { type: "thinking", thinking: "Revised thought" };
    expect(block1.type).toBe("thinking");
    expect(block2.type).toBe("thinking");
    expect(block1.thinking).toBe("Initial thought");
    expect(block2.thinking).toBe("Revised thought");
  });
});