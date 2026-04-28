import { describe, it, expect } from "vitest";
import { runStructuredToolInputValidationPipelineV45 } from "../src/validation/structured-tool-input-validation-pipeline-v45";

describe("runStructuredToolInputValidationPipelineV45", () => {
  it("should return valid when all inputs match the schema", async () => {
    const validInputs = {
      toolName: "get_current_weather",
      parameters: {
        location: "San Francisco",
        unit: "celsius",
      },
    };
    const result = await runStructuredToolInputValidationPipelineV45(validInputs);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect missing required parameters", async () => {
    const invalidInputs = {
      toolName: "get_current_weather",
      parameters: {
        location: "San Francisco",
        // unit is missing and required
      },
    };
    const result = await runStructuredToolInputValidationPipelineV45(invalidInputs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining("Missing required parameter: unit")
    );
  });

  it("should detect type mismatch for parameters", async () => {
    const invalidInputs = {
      toolName: "get_current_weather",
      parameters: {
        location: 12345, // Should be string
        unit: "fahrenheit",
      },
    };
    const result = await runStructuredToolInputValidationPipelineV45(invalidInputs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining("Invalid type for parameter 'location'")
    );
  });
});