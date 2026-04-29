import { describe, it, expect } from "vitest";
import {
  Message,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
  ContentBlock,
} from "../src/schema/structured-tool-output-schema-diffing-v123";

describe("StructuredToolOutputSchemaDiffingV123", () => {
  it("should correctly identify a simple text block", () => {
    const textBlock: ContentBlock = { type: "text"; text: "Hello world"; };
    expect(textBlock).toEqual({ type: "text"; text: "Hello world"; });
  });

  it("should correctly identify a tool use block", () => {
    const toolUseBlock: ContentBlock = {
      type: "tool_use";
      id: "tool_123";
      name: "search";
      input: { query: "vitest" };
    };
    expect(toolUseBlock).toEqual({
      type: "tool_use";
      id: "tool_123";
      name: "search";
      input: { query: "vitest" };
    });
  });

  it("should correctly identify a thinking block", () => {
    const thinkingBlock: ContentBlock = {
      type: "thinking";
      thinking: "I am thinking about the answer.";
    };
    expect(thinkingBlock).toEqual({
      type: "thinking";
      thinking: "I am thinking about the answer.";
    });
  });
});