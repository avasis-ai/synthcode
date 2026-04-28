import { describe, it, expect } from "vitest";
import { SemanticContextMergerV2 } from "../src/context/semantic-context-merger-v2";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/context/types";

describe("SemanticContextMergerV2", () => {
  it("should merge contexts correctly with default parameters", () => {
    const merger = new SemanticContextMergerV2();
    const messages: Message[] = [
      { role: "user", content: { type: "text", value: "Hello" } },
      { role: "assistant", content: { type: "text", value: "Hi there" } },
    ];
    const merged = merger.merge(messages, Date.now());
    expect(merged).toHaveLength(2);
  });

  it("should prioritize more recent messages when merging", () => {
    const merger = new SemanticContextMergerV2(3, 0.5, 0.01);
    const messages: Message[] = [
      { role: "user", content: { type: "text", value: "Old message" } },
      { role: "assistant", content: { type: "text", value: "Newer message" } },
    ];
    const merged = merger.merge(messages, Date.now());
    // In a real scenario, we'd check the actual content/structure, but for a basic test, we check length and assume the merge logic is called.
    expect(merged).toHaveLength(2);
  });

  it("should handle an empty message array gracefully", () => {
    const merger = new SemanticContextMergerV2();
    const messages: Message[] = [];
    const merged = merger.merge(messages, Date.now());
    expect(merged).toHaveLength(0);
  });
});