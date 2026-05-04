import { describe, it, expect } from "vitest";
import { enrichStructuredToolCallContext } from "../src/validation/structured-tool-call-context-enricher-v166-advanced-advanced";

describe("enrichStructuredToolCallContext", () => {
  it("should correctly enrich the context with basic history and constraints", async () => {
    const historyContext = {
      messages: [
        { role: "user", content: [{ type: "text", text: "Hello" }] } as any,
        { role: "assistant", content: [{ type: "text", text: "Hi there!" }] } as any,
      ],
    };
    const constraintContext = {
      constraints: {
        max_tokens: 100,
        temperature: 0.7,
      },
    };
    const knowledgeContext = {
      knowledgeGraphData: {
        user_id: "user123",
        topic: "AI development",
      },
    };
    const toolCallContext = {
      tool_calls: [
        { id: "call1", name: "get_weather", input: { location: "Tokyo" } },
      ],
    };

    const enrichedContext = await enrichStructuredToolCallContext(
      historyContext,
      constraintContext,
      knowledgeContext,
      toolCallContext
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext.history).toEqual(historyContext.messages);
    expect(enrichedContext.constraints).toEqual(constraintContext.constraints);
    expect(enrichedContext.knowledge).toEqual(knowledgeContext.knowledgeGraphData);
    expect(enrichedContext.tool_calls).toEqual(toolCallContext.tool_calls);
  });

  it("should handle empty inputs gracefully", async () => {
    const historyContext = { messages: [] };
    const constraintContext = { constraints: {} };
    const knowledgeContext = { knowledgeGraphData: {} };
    const toolCallContext = { tool_calls: [] };

    const enrichedContext = await enrichStructuredToolCallContext(
      historyContext,
      constraintContext,
      knowledgeContext,
      toolCallContext
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext.history).toEqual([]);
    expect(enrichedContext.constraints).toEqual({});
    expect(enrichedContext.knowledge).toEqual({});
    expect(enrichedContext.tool_calls).toEqual([]);
  });

  it("should correctly merge and structure complex data types", async () => {
    const historyContext = {
      messages: [
        { role: "user", content: [{ type: "text", text: "What is the capital of France?" }] } as any,
        { role: "tool", content: [{ type: "tool_result", tool_use_id: "call1", content: "Paris" }] } as any,
      ],
    };
    const constraintContext = { constraints: { max_tokens: 200 } };
    const knowledgeContext = { knowledgeGraphData: { entities: ["France", "Paris"] } };
    const toolCallContext = {
      tool_calls: [
        { id: "call2", name: "get_capital", input: { country: "France" } },
      ],
    };

    const enrichedContext = await enrichStructuredToolCallContext(
      historyContext,
      constraintContext,
      knowledgeContext,
      toolCallContext
    );

    expect(enrichedContext.history).toEqual(historyContext.messages);
    expect(enrichedContext.constraints).toEqual(constraintContext.constraints);
    expect(enrichedContext.knowledge).toEqual(knowledgeContext.knowledgeGraphData);
    expect(enrichedContext.tool_calls).toEqual(toolCallContext.tool_calls);
  });
});