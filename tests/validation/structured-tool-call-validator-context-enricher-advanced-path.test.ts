import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorContextEnricher } from "../src/validation/structured-tool-call-validator-context-enricher-advanced-path";

describe("StructuredToolCallValidatorContextEnricher", () => {
  it("should correctly enrich context with a simple intended path", () => {
    const enricher = new StructuredToolCallValidatorContextEnricher();
    const initialContext = {
      messages: [{ role: "user", content: "What is the weather?" }],
      intended_path: {
        intended_next_tool_name: "get_weather",
      },
      metadata: {
        source: "user_query",
      },
    };
    const enriched = enricher.enrich(initialContext);

    expect(enriched.intended_path.intended_next_tool_name).toBe("get_weather");
    expect(enriched.messages).toEqual(initialContext.messages);
    expect(enriched.metadata).toEqual(initialContext.metadata);
  });

  it("should correctly enrich context with a full path sequence", () => {
    const enricher = new StructuredToolCallValidatorContextEnricher();
    const pathSequence = [
      {
        tool_name: "search_database",
        input_schema: { query: "user data" },
        expected_output_type: "string",
      },
      {
        tool_name: "format_output",
        input_schema: { data: "string" },
        expected_output_type: "json",
      },
    ];
    const initialContext = {
      messages: [{ role: "system", content: "Start process." }],
      intended_path: {
        path_sequence: pathSequence,
      },
      metadata: {
        session_id: "abc-123",
      },
    };
    const enriched = enricher.enrich(initialContext);

    expect(enriched.intended_path.path_sequence).toBeDefined();
    expect(enriched.intended_path.path_sequence!.length).toBe(2);
    expect(enriched.intended_path.path_sequence![0].tool_name).toBe("search_database");
    expect(enriched.intended_path.path_sequence![1].tool_name).toBe("format_output");
  });

  it("should handle missing intended path data gracefully", () => {
    const enricher = new StructuredToolCallValidatorContextEnricher();
    const initialContext = {
      messages: [{ role: "user", content: "Hello." }],
      intended_path: undefined,
      metadata: {},
    };
    const enriched = enricher.enrich(initialContext);

    expect(enriched.intended_path).toBeDefined();
    expect(enriched.intended_path.intended_next_tool_name).toBeUndefined();
    expect(enriched.intended_path.path_sequence).toBeUndefined();
  });
});