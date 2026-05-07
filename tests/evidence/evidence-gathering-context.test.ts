import { describe, it, expect } from "vitest";
import { ContentBlock } from "../src/evidence/evidence-gathering-context";

describe("ContentBlock structure", () => {
  it("should correctly represent a simple text block", () => {
    const textBlock: ContentBlock = { type: "text", text: "Hello world" };
    expect(textBlock).toHaveProperty("type", "text");
    expect(textBlock).toHaveProperty("text", "Hello world");
  });

  it("should correctly represent a tool use block", () => {
    const toolUseBlock: ContentBlock = {
      type: "tool_use",
      id: "tool_123",
      name: "search_engine",
      input: { query: "vitest testing" },
    };
    expect(toolUseBlock).toHaveProperty("type", "tool_use");
    expect(toolUseBlock).toHaveProperty("id", "tool_123");
    expect(toolUseBlock).toHaveProperty("name", "search_engine");
    expect(toolUseBlock).toHaveProperty("input", { query: "vitest testing" });
  });

  it("should correctly represent a thinking block", () => {
    const thinkingBlock: ContentBlock = {
      type: "thinking",
      thinking: "I need to analyze the user's request first.",
    };
    expect(thinkingBlock).toHaveProperty("type", "thinking");
    expect(thinkingBlock).toHaveProperty("thinking", "I need to analyze the user's request first.");
  });
});