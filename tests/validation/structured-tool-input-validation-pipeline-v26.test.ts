import { describe, it, expect } from "vitest";
import {
  StructuredToolInputValidationPipelineV26,
} from "../src/validation/structured-tool-input-validation-pipeline-v26";

describe("StructuredToolInputValidationPipelineV26", () => {
  it("should return valid result when all inputs are correct", async () => {
    const inputs = {
      toolName: "getWeather",
      parameters: {
        location: "New York",
        date: "2024-12-25",
      },
    };
    const context = {};
    const result = await StructuredToolInputValidationPipelineV26(inputs, context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid result with errors for missing required fields", async () => {
    const inputs = {
      toolName: "getWeather",
      parameters: {
        // location is missing
        date: "2024-12-25",
      },
    };
    const context = {};
    const result = await StructuredToolInputValidationPipelineV26(inputs, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required parameter: location");
  });

  it("should handle type mismatches in parameters", async () => {
    const inputs = {
      toolName: "calculateDistance",
      parameters: {
        start: "abc", // Should be a number
        end: 100,
      },
    };
    const context = {};
    const result = await StructuredToolInputValidationPipelineV26(inputs, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid type for parameter 'start': Expected number, got string");
  });
});