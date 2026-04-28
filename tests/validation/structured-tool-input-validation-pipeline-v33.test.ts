import { describe, it, expect } from "vitest";
import {
  StructuredToolInputValidationPipelineV33,
} from "../src/validation/structured-tool-input-validation-pipeline-v33";

describe("StructuredToolInputValidationPipelineV33", () => {
  it("should return valid result for correctly structured input", async () => {
    const context: any = {
      inputData: {
        toolName: "search",
        parameters: { query: "test query" },
      },
      history: [],
      metadata: {},
    };
    const result = await StructuredToolInputValidationPipelineV33(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid result with errors for missing required parameters", async () => {
    const context: any = {
      inputData: {
        toolName: "search",
        parameters: {},
      },
      history: [],
      metadata: {},
    };
    const result = await StructuredToolInputValidationPipelineV33(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required parameter: query");
  });

  it("should update context correctly even if validation fails", async () => {
    const context: any = {
      inputData: {
        toolName: "search",
        parameters: { query: "test query" },
      },
      history: [{
        role: "user",
        content: "Hello",
      }],
      metadata: {
        sessionId: "abc-123",
      },
    };
    const result = await StructuredToolInputValidationPipelineV33(context);
    expect(result.updatedContext.history).toHaveLength(1);
    expect(result.updatedContext.metadata).toEqual({
      sessionId: "abc-123",
    });
  });
});