import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationContextEnricherV153,
  EnrichedValidationContext,
} from "../src/validation/structured-tool-output-validation-context-enricher-v153";

describe("StructuredToolOutputValidationContextEnricherV153", () => {
  it("should enrich context with tool call results when available", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV153();
    const originalContext: EnrichedValidationContext = {
      original_context: "some original context",
      tool_call_results: [
        {
          tool_use_id: "tool_1",
          result: { key1: "value1", key2: 123 },
          metadata: { source: "test" },
        },
      ],
      dependency_metadata: [
        {
          source_step_id: "step_a",
          source_type: "tool_call",
          data_path: "result.key1",
          value: "value1",
        },
      ],
    };

    const enrichedContext = await enricher.enrich(originalContext);

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.tool_call_results).toHaveLength(1);
    expect(enrichedContext?.dependency_metadata).toHaveLength(1);
  });

  it("should handle empty tool call results gracefully", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV153();
    const originalContext: EnrichedValidationContext = {
      original_context: "empty context",
      tool_call_results: [],
      dependency_metadata: [],
    };

    const enrichedContext = await enricher.enrich(originalContext);

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.tool_call_results).toEqual([]);
    expect(enrichedContext?.dependency_metadata).toEqual([]);
  });

  it("should correctly process multiple tool call results and metadata", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV153();
    const originalContext: EnrichedValidationContext = {
      original_context: "complex context",
      tool_call_results: [
        {
          tool_use_id: "tool_1",
          result: { a: 1 },
        },
        {
          tool_use_id: "tool_2",
          result: { b: "two" },
        },
      ],
      dependency_metadata: [
        {
          source_step_id: "step_a",
          source_type: "tool_call",
          data_path: "result.a",
          value: 1,
        },
        {
          source_step_id: "step_b",
          source_type: "manual",
          data_path: "input.user",
          value: "user input",
        },
      ],
    };

    const enrichedContext = await enricher.enrich(originalContext);

    expect(enrichedContext?.tool_call_results).toHaveLength(2);
    expect(enrichedContext?.dependency_metadata).toHaveLength(2);
    expect(enrichedContext?.tool_call_results![0].tool_use_id).toBe("tool_1");
    expect(enrichedContext?.dependency_metadata![1].source_type).toBe("manual");
  });
});