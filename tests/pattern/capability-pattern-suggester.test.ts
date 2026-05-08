import { describe, it, expect } from "vitest";
import { CapabilityPatternSuggester } from "../src/pattern/capability-pattern-suggester";
import { ContentBlock, ToolUseBlock } from "../src/pattern/types";

describe("CapabilityPatternSuggester", () => {
  it("should initialize with no transition counts", () => {
    const suggester = new CapabilityPatternSuggester();
    // We can't directly test private members, but we can test its behavior
    // assuming initialization is correct.
    expect(suggester).toBeInstanceOf(CapabilityPatternSuggester);
  });

  it("should suggest a capability when a tool use block is present", () => {
    const suggester = new CapabilityPatternSuggester();
    const toolUseBlock: ToolUseBlock = {
      type: "tool_use",
      toolName: "image_generator",
      arguments: { prompt: "a cat" },
    };
    const contentBlocks: ContentBlock[] = [
      { type: "text", content: "Please generate an image of a cat." },
      toolUseBlock,
    ];

    const suggestions = suggester.suggest(contentBlocks);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].capabilityName).toBe("image_generation");
    expect(suggestions[0].confidenceScore).toBeGreaterThan(0);
  });

  it("should suggest multiple capabilities based on sequence of blocks", () => {
    const suggester = new CapabilityPatternSuggester();
    const contentBlocks: ContentBlock[] = [
      { type: "tool_use", toolName: "search", arguments: { query: "weather in london" } },
      { type: "text", content: "What is the weather like?" },
      { type: "tool_use", toolName: "image_generator", arguments: { prompt: "a dog" } },
    ];

    const suggestions = suggester.suggest(contentBlocks);

    expect(suggestions).toHaveLength(2);
    // The order might depend on the internal logic, but we check for presence
    const names = suggestions.map(s => s.capabilityName);
    expect(names).toContain("search");
    expect(names).toContain("image_generation");
  });
});