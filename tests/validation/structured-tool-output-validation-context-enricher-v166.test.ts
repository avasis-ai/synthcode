import { describe, it, expect } from "vitest";
import { enrichValidationContext } from "../src/validation/structured-tool-output-validation-context-enricher-v166";

describe("enrichValidationContext", () => {
  it("should correctly enrich the context with mock resource metrics and history", () => {
    const originalContext = {
      user_id: "user123",
      session_id: "session456",
    };
    const mockResourceMetrics = {
      cpu_usage_percent: 45.5,
      memory_usage_mb: 1024,
      execution_time_ms: 150,
    };
    const mockExecutionHistory = {
      history_length: 5,
      last_tool_call_id: "tool_call_xyz",
    };

    const enrichedContext = enrichValidationContext(
      originalContext,
      mockResourceMetrics,
      mockExecutionHistory
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext.originalContext).toEqual(originalContext);
    expect(enrichedContext.resourceMetrics).toEqual(mockResourceMetrics);
    expect(enrichedContext.executionHistory).toEqual(mockExecutionHistory);
  });

  it("should handle null or undefined values gracefully for resource metrics and history", () => {
    const originalContext = {
      user_id: "user123",
    };
    const mockResourceMetrics = null;
    const mockExecutionHistory = undefined;

    const enrichedContext = enrichValidationContext(
      originalContext,
      mockResourceMetrics,
      mockExecutionHistory
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext.originalContext).toEqual(originalContext);
    expect(enrichedContext.resourceMetrics).toBeNull();
    expect(enrichedContext.executionHistory).toBeUndefined();
  });

  it("should return a structure with default values if inputs are missing (assuming the function handles defaults)", () => {
    const originalContext = {
      user_id: "user123",
    };
    // Assuming the function might default metrics if not provided, or we test the structure integrity
    const enrichedContext = enrichValidationContext(
      originalContext,
      undefined,
      undefined
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext.originalContext).toEqual(originalContext);
    // Based on the interface, we expect the structure to be present, even if values are default/null
    expect(enrichedContext.resourceMetrics).toEqual({
      cpu_usage_percent: 0,
      memory_usage_mb: 0,
      execution_time_ms: 0,
    });
    expect(enrichedContext.executionHistory).toEqual({
      history_length: 0,
      last_tool_call_id: null,
    });
  });
});