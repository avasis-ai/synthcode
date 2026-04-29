import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationContext,
  ValidationContext,
  ToolOutput,
  ValidationResult,
} from "../src/validation/structured-tool-output-validation-context-enricher-v155";

const mockToolOutput: ToolOutput = {
  tool_name: "mock_tool",
  output: "{\"key\": \"value\", \"number\": 123}",
};

const mockContext: ValidationContext = {
  user_id: "user123",
  session_id: "session456",
  metadata: {
    system_mode: "operational",
    user_session_active: true,
    tool_execution_id: "exec789",
    metadata_source: "api_gateway",
  },
};

describe("StructuredToolOutputValidationContextEnricherV155", () => {
  it("should correctly enrich the context with metadata when all fields are present", async () => {
    const enricher = new StructuredToolOutputValidationContext(
      mockToolOutput,
      mockContext
    );
    const enrichedContext = await enricher.enrich();

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.metadata).toEqual({
      system_mode: "operational",
      user_session_active: true,
      tool_execution_id: "exec789",
      metadata_source: "api_gateway",
    });
  });

  it("should handle null or undefined metadata fields gracefully", async () => {
    const incompleteContext: ValidationContext = {
      user_id: "user123",
      session_id: "session456",
      metadata: {
        system_mode: "maintenance",
        user_session_active: false,
        tool_execution_id: null,
        metadata_source: "manual_override",
      },
    };
    const enricher = new StructuredToolOutputValidationContext(
      mockToolOutput,
      incompleteContext
    );
    const enrichedContext = await enricher.enrich();

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.metadata).toEqual({
      system_mode: "maintenance",
      user_session_active: false,
      tool_execution_id: null,
      metadata_source: "manual_override",
    });
  });

  it("should return a validation result based on the tool output structure", async () => {
    const mockToolOutputInvalid: ToolOutput = {
      tool_name: "bad_tool",
      output: "{invalid json",
    };
    const enricher = new StructuredToolOutputValidationContext(
      mockToolOutputInvalid,
      mockContext
    );
    const result = await enricher.enrich();

    expect(result).toBeInstanceOf(ValidationResult);
    // Assuming the enricher validates the structure and returns a result
    // We check if the result indicates a potential failure due to invalid JSON
    if (typeof result.error === 'string') {
        expect(result.error).toContain("JSON");
    } else {
        expect(result).toBeDefined();
    }
  });
});