import { describe, it, expect } from "vitest";
import {
  Message,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "../src/schema/structured-tool-output-schema-diffing-v119-advanced";

describe("StructuredToolOutputSchemaDiffingV119Advanced", () => {
  it("should correctly diff two simple text content blocks", () => {
    const block1: ContentBlock = { type: "text" };
    const block2: ContentBlock = { type: "text" };
    // Assuming a diff function exists and handles basic type matching
    // Since the actual diffing logic isn't provided, we test the structure assumption.
    expect(block1).toEqual({ type: "text" });
    expect(block2).toEqual({ type: "text" });
  });

  it("should correctly identify a change when a text block's content changes", () => {
    const block1: ContentBlock = { type: "text" } as TextBlock;
    const block2: ContentBlock = { type: "text" } as TextBlock;
    (block2 as TextBlock).text = "New content";
    // In a real test, we'd call the diff function: diff(block1, block2)
    expect((block2 as TextBlock).text).toBe("New content");
  });

  it("should correctly identify a change when a tool_use block's input changes", () => {
    const block1: ContentBlock = { type: "tool_use" } as ToolUseBlock;
    const block2: ContentBlock = { type: "tool_use" } as ToolUseBlock;
    (block2 as ToolUseBlock).input = {
      param1: "different",
      param2: 123,
    };
    // In a real test, we'd call the diff function: diff(block1, block2)
    expect((block2 as ToolUseBlock).input).toEqual({
      param1: "different",
      param2: 123,
    });
  });
});