import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricher } from "../src/validation/structured-tool-output-validation-context-enricher-v161-advanced";
import { Message, ContentBlock, ToolResultMessage } from "../src/validation/types";

describe("StructuredToolOutputValidationContextEnricher", () => {
  it("should enrich context with correct metadata when validation fails", async () => {
    const mockMetadataService = vi.fn((failureDetails) => {
      return {
        suggestedFix: "Please check the structure of the tool output.",
        severity: "error",
        documentationLink: "http://example.com/schema-guide",
      };
    });

    const enricher = new StructuredToolOutputValidationContextEnricher(mockMetadataService);
    const mockFailureDetails: FailureDetails = {
      failureType: "SchemaMismatch",
      context: {
        toolName: "user_profile_fetcher",
        expected: { id: "string" },
        actual: { id: 123 },
      },
      originalMessage: {
        role: "assistant",
        content: [{ type: "text", text: "Tool output validation failed." }],
      },
    };

    await enricher.enrichContext(mockFailureDetails);

    expect(mockMetadataService).toHaveBeenCalledWith(mockFailureDetails);
  });

  it("should handle enrichment when no specific metadata is provided", async () => {
    const mockMetadataService = vi.fn((failureDetails) => {
      return {
        suggestedFix: "Review the input parameters.",
        severity: "warning",
      };
    });

    const enricher = new StructuredToolOutputValidationContextEnricher(mockMetadataService);
    const mockFailureDetails: FailureDetails = {
      failureType: "MissingField",
      context: {
        toolName: "data_processor",
        missingField: "timestamp",
      },
      originalMessage: {
        role: "assistant",
        content: [{ type: "text", text: "Required field is missing." }],
      },
    };

    await enricher.enrichContext(mockFailureDetails);

    expect(mockMetadataService).toHaveBeenCalledTimes(1);
    expect(mockMetadataService).toHaveBeenCalledWith(mockFailureDetails);
  });

  it("should correctly process and store the enriched context", async () => {
    const mockMetadataService = vi.fn((failureDetails) => {
      return {
        suggestedFix: "Corrected structure.",
        severity: "info",
        suggestedSchemaUpdate: { field: "new_field", type: "string" },
      };
    });

    const enricher = new StructuredToolOutputValidationContextEnricher(mockMetadataService);
    const mockFailureDetails: FailureDetails = {
      failureType: "TypeMismatch",
      context: {
        toolName: "calculator",
        input: "abc",
        expectedType: "number",
      },
      originalMessage: {
        role: "assistant",
        content: [{ type: "text", text: "Type mismatch detected." }],
      },
    };

    const enrichedContext = await enricher.enrichContext(mockFailureDetails);

    expect(enrichedContext).toHaveProperty("metadata");
    expect(enrichedContext.metadata).toEqual({
      suggestedFix: "Corrected structure.",
      severity: "info",
      suggestedSchemaUpdate: { field: "new_field", type: "string" },
    });
    expect(enrichedContext).toHaveProperty("originalFailure");
    expect(enrichedContext.originalFailure).toEqual(mockFailureDetails);
  });
});