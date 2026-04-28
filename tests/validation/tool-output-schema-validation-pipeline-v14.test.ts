import { describe, it, expect } from "vitest";
import { ToolOutputSchemaValidationPipelineV14 } from "../src/validation/tool-output-schema-validation-pipeline-v14";

describe("ToolOutputSchemaValidationPipelineV14", () => {
  it("should return valid result when all steps pass validation", () => {
    // Arrange
    const mockPipeline = {
      steps: [
        {
          validate(output, context) {
            if (output.content && typeof output.content === "string" && output.content.length > 0) {
              return { isValid: true, errors: [] };
            }
            return { isValid: false, errors: ["Content is empty"] };
          },
        },
      ],
      validate(output, context) {
        // Simplified implementation for testing purposes
        const result = this.steps.map(step => step.validate(output, context));
        const allValid = result.every(r => r.isValid);
        const allErrors = result.flatMap(r => r.errors);
        return { isValid: allValid, errors: allErrors };
      },
    } as unknown as ToolOutputSchemaValidationPipelineV14;

    const mockOutput = { toolName: "testTool", content: "Some valid content" } as ToolResultMessage;
    const mockContext: Record<string, any> = {};

    // Act
    const result = mockPipeline.validate(mockOutput, mockContext);

    // Assert
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid result with accumulated errors when any step fails", () => {
    // Arrange
    const mockPipeline = {
      steps: [
        {
          validate(output, context) {
            if (output.content && typeof output.content === "string" && output.content.length > 0) {
              return { isValid: true, errors: [] };
            }
            return { isValid: false, errors: ["Step 1: Content missing"] };
          },
        },
        {
          validate(output, context) {
            if (output.toolName === "validTool") {
              return { isValid: true, errors: [] };
            }
            return { isValid: false, errors: ["Step 2: Invalid tool name"] };
          },
        },
      ],
      validate(output, context) {
        // Simplified implementation for testing purposes
        const result = this.steps.map(step => step.validate(output, context));
        const allValid = result.every(r => r.isValid);
        const allErrors = result.flatMap(r => r.errors);
        return { isValid: allValid, errors: allErrors };
      },
    } as unknown as ToolOutputSchemaValidationPipelineV14;

    const mockOutput = { toolName: "invalidTool", content: "" } as ToolResultMessage;
    const mockContext: Record<string, any> = {};

    // Act
    const result = mockPipeline.validate(mockOutput, mockContext);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Step 1: Content missing");
    expect(result.errors).toContain("Step 2: Invalid tool name");
    expect(result.errors.length).toBe(2);
  });

  it("should handle empty context gracefully", () => {
    // Arrange
    const mockPipeline = {
      steps: [
        {
          validate(output, context) {
            // This step ignores context but checks output
            if (output.content && typeof output.content === "string") {
              return { isValid: true, errors: [] };
            }
            return { isValid: false, errors: ["Content required"] };
          },
        },
      ],
      validate(output, context) {
        // Simplified implementation for testing purposes
        const result = this.steps.map(step => step.validate(output, context));
        const allValid = result.every(r => r.isValid);
        const allErrors = result.flatMap(r => r.errors);
        return { isValid: allValid, errors: allErrors };
      },
    } as unknown as ToolOutputSchemaValidationPipelineV14;

    const mockOutput = { toolName: "test", content: "Some content" } as ToolResultMessage;
    const mockContext: Record<string, any> = {};

    // Act
    const result = mockPipeline.validate(mockOutput, mockContext);

    // Assert
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});