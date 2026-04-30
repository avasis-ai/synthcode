import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationContextEnricherV163Advanced,
} from "../src/validation/structured-tool-output-validation-context-enricher-v163-advanced";

describe("StructuredToolOutputValidationContextEnricherV163Advanced", () => {
  it("should enrich context when history is present and tool calls are made", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV163Advanced();
    const originalContext: Record<string, unknown> = {
      user_id: "user123",
      session_id: "session456",
    };
    const history: {
      messages: any[];
      tool_calls: {
        id: string;
        name: string;
        input: Record<string, unknown>;
      }[];
    } = {
      messages: [{ role: "user", content: "What is the weather?" }],
      tool_calls: [
        { id: "call1", name: "get_weather", input: { location: "New York" } },
        { id: "call2", name: "get_time", input: {} },
      ],
    };

    const enrichedContext = await enricher.enrichContext(
      originalContext,
      history
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext.historyMetadata.lastToolCallId).toBe("call2");
    expect(enrichedContext.historyMetadata.relevantToolUses).toHaveLength(2);
    expect(enrichedContext.historyMetadata.relevantToolUses).toEqual(
      expect.arrayContaining([
        { id: "call1", name: "get_weather", input: { location: "New York" } },
        { id: "call2", name: "get_time", input: {} },
      ])
    );
  });

  it("should handle context enrichment when no tool calls are present in history", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV163Advanced();
    const originalContext: Record<string, unknown> = {
      user_id: "user123",
    };
    const history: {
      messages: any[];
      tool_calls: {
        id: string;
        name: string;
        input: Record<string, unknown>;
      }[];
    } = {
      messages: [{ role: "user", content: "Hello" }],
      tool_calls: [],
    };

    const enrichedContext = await enricher.enrichContext(
      originalContext,
      history
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext.historyMetadata.lastToolCallId).toBeNull();
    expect(enrichedContext.historyMetadata.relevantToolUses).toHaveLength(0);
    expect(enrichedContext.originalContext).toEqual(originalContext);
  });

  it("should correctly merge original context with enriched data", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV163Advanced();
    const originalContext: Record<string, unknown> = {
      user_id: "user123",
      tenant_id: "tenantA",
    };
    const history: {
      messages: any[];
      tool_calls: {
        id: string;
        name: string;
        input: Record<string, unknown>;
      }[];
    } = {
      messages: [{ role: "user", content: "Check status" }],
      tool_calls: [
        { id: "call3", name: "check_status", input: { resource: "server" } },
      ],
    };

    const enrichedContext = await enricher.enrichContext(
      originalContext,
      history
    );

    expect(enrichedContext.originalContext).toEqual({
      user_id: "user123",
      tenant_id: "tenantA",
    });
    expect(enrichedContext.historyMetadata.lastToolCallId).toBe("call3");
  });
});