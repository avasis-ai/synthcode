import { describe, it, expect } from "vitest";
import { StructuredToolCallContextEnricher, MergeStrategy } from "../src/validation/structured-tool-call-context-enricher-v169-advanced-advanced";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/validation/types";

describe("StructuredToolCallContextEnricher", () => {
  it("should correctly enrich context using Precedence strategy", () => {
    const source1: ContextSource = {
      priority: 1,
      data: {
        role: "user",
        content: [
          { type: "text", text: "Initial user message." },
        ],
      },
    };
    const source2: ContextSource = {
      priority: 2,
      data: {
        role: "assistant",
        content: [
          { type: "tool_use", tool_use: { name: "get_weather", tool_call_id: "call1" } },
        ],
      },
    };

    const enricher = new StructuredToolCallContextEnricher([source1, source2], MergeStrategy.Precedence);
    const enrichedContext = enricher.enrich();

    expect(enrichedContext.role).toBe("assistant");
    expect(enrichedContext.content).toHaveLength(1);
    expect(enrichedContext.content[0].type).toBe("tool_use");
    expect(enrichedContext.content[0].tool_use.name).toBe("get_weather");
  });

  it("should merge content blocks using Merge strategy", () => {
    const source1: ContextSource = {
      priority: 1,
      data: {
        role: "user",
        content: [
          { type: "text", text: "Hello, " },
        ],
      },
    };
    const source2: ContextSource = {
      priority: 2,
      data: {
        role: "assistant",
        content: [
          { type: "text", text: "how are you?" },
        ],
      },
    };

    const enricher = new StructuredToolCallContextEnricher([source1, source2], MergeStrategy.Merge);
    const enrichedContext = enricher.enrich();

    expect(enrichedContext.role).toBe("assistant"); // Role might be determined by the highest priority or last source, depending on implementation details, but content merging is key.
    expect(enrichedContext.content).toHaveLength(2);
    expect(enrichedContext.content.map(c => c.type)).toEqual(["text", "text"]);
  });

  it("should deduplicate content blocks using Deduplicate strategy", () => {
    const source1: ContextSource = {
      priority: 1,
      data: {
        role: "user",
        content: [
          { type: "text", text: "Important info." },
        ],
      },
    };
    const source2: ContextSource = {
      priority: 2,
      data: {
        role: "user",
        content: [
          { type: "text", text: "Important info." }, // Duplicate content
        ],
      },
    };

    const enricher = new StructuredToolCallContextEnricher([source1, source2], MergeStrategy.Deduplicate);
    const enrichedContext = enricher.enrich();

    expect(enrichedContext.content).toHaveLength(1);
    expect(enrichedContext.content[0].type).toBe("text");
  });
});