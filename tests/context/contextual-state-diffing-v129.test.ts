import { describe, it, expect } from "vitest";
import {
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "../src/context/contextual-state-diffing-v129";

describe("ContentBlock structure", () => {
  it("should correctly define a TextBlock", () => {
    const textBlock: TextBlock = { type: "text", text: "Hello world" };
    expect(textBlock).toHaveProperty("type", "text");
    expect(textBlock).toHaveProperty("text", "Hello world");
  });

  it("should correctly define a ToolUseBlock", () => {
    const toolUseBlock: ToolUseBlock = {
      type: "tool_use",
      id: "tool123",
      name: "search",
      input: { query: "vitest" },
    };
    expect(toolUseBlock).toHaveProperty("type", "tool_use");
    expect(toolUseBlock).toHaveProperty("id", "tool123");
    expect(toolUseBlock).toHaveProperty("name", "search");
    expect(toolUseBlock).toHaveProperty("input", { query: "vitest" });
  });

  it("should correctly define a ThinkingBlock", () => {
    const thinkingBlock: ThinkingBlock = {
      type: "thinking",
      thinking: "I am thinking about the state.",
    };
    expect(thinkingBlock).toHaveProperty("type", "thinking");
    expect(thinkingBlock).toHaveProperty("thinking", "I am thinking about the state.");
  });
});