import { describe, it, expect } from "vitest";
import {
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "../src/visualization/dynamic-dependency-graph-visualizer-v139-advanced";

describe("ContentBlock structure", () => {
  it("should correctly identify a TextBlock", () => {
    const textBlock: TextBlock = { type: "text", text: "Hello world" };
    expect(textBlock).toHaveProperty("type", "text");
    expect(textBlock).toHaveProperty("text", "Hello world");
  });

  it("should correctly identify a ToolUseBlock", () => {
    const toolUseBlock: ToolUseBlock = {
      type: "tool_use",
      id: "tool_123",
      name: "search",
      input: { query: "test" },
    };
    expect(toolUseBlock).toHaveProperty("type", "tool_use");
    expect(toolUseBlock).toHaveProperty("id", "tool_123");
    expect(toolUseBlock).toHaveProperty("name", "search");
    expect(toolUseBlock).toHaveProperty("input", { query: "test" });
  });

  it("should correctly identify a ThinkingBlock", () => {
    const thinkingBlock: ThinkingBlock = {
      type: "thinking",
      thinking: "I am thinking about the answer.",
    };
    expect(thinkingBlock).toHaveProperty("type", "thinking");
    expect(thinkingBlock).toHaveProperty("thinking", "I am thinking about the answer.");
  });
});