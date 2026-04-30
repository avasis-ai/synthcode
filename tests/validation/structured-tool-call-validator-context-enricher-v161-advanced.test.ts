import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorContextEnricher } from "../src/validation/structured-tool-call-validator-context-enricher-v161-advanced";
import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, ToolUseBlock, ThinkingBlock } from "../src/validation/types";

describe("StructuredToolCallValidatorContextEnricher", () => {
  it("should correctly enrich context when no specific path constraints are provided", () => {
    const enricher = new StructuredToolCallValidatorContextEnricher();
    const context: ValidationContext = {
      history: [
        new UserMessage("Hello"),
        new AssistantMessage("Hi there!"),
      ],
      currentState: {
        user_id: "user123",
      },
      intendedPath: {
        allowedSequence: ["toolA", "toolB"],
      },
    };
    const enrichedContext = enricher.enrich(context);
    expect(enrichedContext.history).toBe(context.history);
    expect(enrichedContext.currentState).toBe(context.currentState);
    expect(enrichedContext.intendedPath).toEqual(context.intendedPath);
  });

  it("should prioritize 'expectedNextTool' when available", () => {
    const enricher = new StructuredToolCallValidatorContextEnricher();
    const context: ValidationContext = {
      history: [new UserMessage("Start")],
      currentState: {},
      intendedPath: {
        expectedNextTool: "toolX",
        allowedSequence: ["toolY", "toolX"],
      },
    };
    const enrichedContext = enricher.enrich(context);
    expect(enrichedContext.intendedPath?.expectedNextTool).toBe("toolX");
    expect(enrichedContext.intendedPath?.allowedSequence).toEqual(["toolY", "toolX"]);
  });

  it("should handle empty history and default context gracefully", () => {
    const enricher = new StructuredToolCallValidatorContextEnricher();
    const context: ValidationContext = {
      history: [],
      currentState: {},
      intendedPath: {},
    };
    const enrichedContext = enricher.enrich(context);
    expect(enrichedContext.history).toEqual([]);
    expect(enrichedContext.currentState).toEqual({});
    expect(enrichedContext.intendedPath).toEqual({});
  });
});