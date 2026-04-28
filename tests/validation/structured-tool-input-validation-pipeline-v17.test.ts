import { describe, it, expect } from "vitest";
import {
  StructuredToolInputValidationPipelineV17,
  ProjectContext,
  ToolInvocationRecord,
  ValidationResult,
} from "../src/validation/structured-tool-input-validation-pipeline-v17";

describe("StructuredToolInputValidationPipelineV17", () => {
  it("should return valid result for a simple, correctly structured input", async () => {
    const context: ProjectContext = {
      history: [],
      metadata: {},
    };
    const toolInput: Record<string, unknown> = {
      query: "What is the capital of France?",
      model: "gpt-4o",
    };
    const result = await StructuredToolInputValidationPipelineV17(
      context,
      toolInput,
      null,
    );
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.contextualIssues).toHaveLength(0);
  });

  it("should detect missing required fields in the tool input", async () => {
    const context: ProjectContext = {
      history: [],
      metadata: {},
    };
    const toolInput: Record<string, unknown> = {
      query: "Only query provided",
    };
    const result = await StructuredToolInputValidationPipelineV17(
      context,
      toolInput,
      null,
    );
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field: model");
  });

  it("should detect context-dependent issues when history is present", async () => {
    const context: ProjectContext = {
      history: [
        {
          type: "user",
          content: [{ type: "text", text: "First question." }],
        },
        {
          type: "assistant",
          content: [{ type: "text", text: "The answer was X." }],
        },
      ],
      metadata: {
        user_role: "admin",
      },
    };
    const toolInput: Record<string, unknown> = {
      query: "Follow up question?",
      model: "gpt-4o",
    };
    const result = await StructuredToolInputValidationPipelineV17(
      context,
      toolInput,
      null,
    );
    // Assuming the pipeline checks for context consistency, we check for at least one issue
    expect(result.isValid).toBe(false);
    expect(result.contextualIssues).toHaveLength(1);
  });
});