import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorContextEnricherV168 } from "../src/validation/structured-tool-call-validator-context-enricher-v168";
import { Message } from "../src/validation/types";

describe("StructuredToolCallValidatorContextEnricherV168", () => {
  it("should enrich context when an intended tool call is present", () => {
    const enricher = new StructuredToolCallValidatorContextEnricherV168();
    const messages: Message[] = [
      { role: "user", content: "What is the weather like?" },
    ];
    const intendedToolCall = { name: "get_weather", input: { location: "New York" } };

    const enrichedContext = enricher.enrich(messages, intendedToolCall);

    expect(enrichedContext.messages).toEqual(messages);
    expect(enrichedContext.intended_tool_call).toEqual({
      name: "get_weather",
      input: { location: "New York" },
    });
    expect(enrichedContext.execution_path).toEqual([]);
  });

  it("should handle null intended tool call gracefully", () => {
    const enricher = new StructuredToolCallValidatorContextEnricherV168();
    const messages: Message[] = [
      { role: "user", content: "Hello!" },
    ];
    const intendedToolCall = null;

    const enrichedContext = enricher.enrich(messages, intendedToolCall);

    expect(enrichedContext.messages).toEqual(messages);
    expect(enrichedContext.intended_tool_call).toBeNull();
    expect(enrichedContext.execution_path).toEqual([]);
  });

  it("should return empty execution path if no steps are recorded", () => {
    const enricher = new StructuredToolCallValidatorContextEnricherV168();
    const messages: Message[] = [
      { role: "user", content: "Test" },
    ];
    const intendedToolCall = { name: "some_tool", input: {} };

    const enrichedContext = enricher.enrich(messages, intendedToolCall);

    expect(enrichedContext.execution_path).toEqual([]);
  });
});