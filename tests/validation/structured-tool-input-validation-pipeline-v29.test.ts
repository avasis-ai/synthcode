import { describe, it, expect } from "vitest";
import {
  StructuredToolInputValidationPipelineV29,
  ValidationContext,
  ValidationResult,
} from "../src/validation/structured-tool-input-validation-pipeline-v29";

describe("StructuredToolInputValidationPipelineV29", () => {
  it("should return valid result when input data is correct", async () => {
    const context: ValidationContext = {
      inputData: {
        toolName: "getWeather",
        parameters: {
          location: "New York",
          unit: "celsius",
        },
      },
      history: [],
      metadata: {},
    };
    const result: ValidationResult = await StructuredToolInputValidationPipelineV29(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should return invalid result with errors for missing required parameters", async () => {
    const context: ValidationContext = {
      inputData: {
        toolName: "getWeather",
        parameters: {
          // location is missing
          unit: "fahrenheit",
        },
      },
      history: [],
      metadata: {},
    };
    const result: ValidationResult = await StructuredToolInputValidationPipelineV29(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("location is required");
  });

  it("should handle empty input data gracefully", async () => {
    const context: ValidationContext = {
      inputData: {},
      history: [],
      metadata: {},
    };
    const result: ValidationResult = await StructuredToolInputValidationPipelineV29(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("Input data is empty");
  });
});