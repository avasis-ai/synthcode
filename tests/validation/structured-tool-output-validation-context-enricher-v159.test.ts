import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricher } from "../src/validation/structured-tool-output-validation-context-enricher-v159";
import { ValidationContext, ToolResultMessage, Message } from "../src/validation/context-types";

describe("StructuredToolOutputValidationContextEnricher", () => {
  it("should enrich context with project and agent information when valid tool output is provided", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const mockValidationContext: ValidationContext = {
      // Mock implementation details if necessary
    };
    const mockRawToolOutput: ToolResultMessage = {
      tool_name: "mock_tool",
      output: JSON.stringify({ result: "success", data: "test" }),
    };
    const mockProjectContext: any = {
      current_project_state: { status: "ready" },
      recent_file_changes: [{ path: "file.txt", changes: "updated" }],
    };
    const mockAgentContext: any = {
      user_intent_summary: "User wants to check status",
      session_history: [
        { role: "user", content: "Hello" }
      ]
    };

    const enrichedContext = await enricher.enrichContext(
      mockValidationContext,
      mockRawToolOutput,
      mockProjectContext,
      mockAgentContext
    );

    expect(enrichedContext).toBeDefined();
    // Add specific assertions based on expected enrichment logic
    expect(enrichedContext.tool_result_summary).toContain("success");
    expect(enrichedContext.project_state).toEqual(mockProjectContext.current_project_state);
  });

  it("should handle empty or null tool output gracefully", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const mockValidationContext: ValidationContext = {
      // Mock implementation details
    };
    const mockRawToolOutput: ToolResultMessage = {
      tool_name: "mock_tool",
      output: null,
    };
    const mockProjectContext: any = {
      current_project_state: {},
      recent_file_changes: [],
    };
    const mockAgentContext: any = {
      user_intent_summary: "Test",
      session_history: []
    };

    const enrichedContext = await enricher.enrichContext(
      mockValidationContext,
      mockRawToolOutput,
      mockProjectContext,
      mockAgentContext
    );

    expect(enrichedContext).toBeDefined();
    // Expecting that the context is enriched but perhaps with default/empty values for the tool result
    expect(enrichedContext.tool_result_summary).toBe("");
  });

  it("should correctly merge context data from all provided sources", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const mockValidationContext: ValidationContext = {
      // Mock implementation details
    };
    const mockRawToolOutput: ToolResultMessage = {
      tool_name: "mock_tool",
      output: JSON.stringify({ result: "ok", data: "final" }),
    };
    const mockProjectContext: any = {
      current_project_state: { version: "1.0" },
      recent_file_changes: [{ path: "config.json", changes: "modified" }],
    };
    const mockAgentContext: any = {
      user_intent_summary: "Final check",
      session_history: [{ role: "system", content: "Start" }]
    };

    const enrichedContext = await enricher.enrichContext(
      mockValidationContext,
      mockRawToolOutput,
      mockProjectContext,
      mockAgentContext
    );

    expect(enrichedContext).toBeDefined();
    // Check if specific pieces of data from all sources are present
    expect(enrichedContext.user_intent_summary).toBe("Final check");
    expect(enrichedContext.project_state.version).toBe("1.0");
    expect(enrichedContext.tool_result_summary).toContain("ok");
  });
});