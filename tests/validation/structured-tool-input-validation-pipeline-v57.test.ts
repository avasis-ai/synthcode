import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipelineV57 } from "../src/validation/structured-tool-input-validation-pipeline-v57";

describe("StructuredToolInputValidationPipelineV57", () => {
  it("should return valid result for correctly structured input", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV57();
    const input = {
      toolName: "getWeather",
      parameters: {
        location: "New York",
        unit: "celsius",
      },
    };
    const result = await pipeline.validate(input);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid result with specific errors for missing required fields", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV57();
    const input = {
      toolName: "getWeather",
      parameters: {
        // location is missing
        unit: "fahrenheit",
      },
    };
    const result = await pipeline.validate(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required parameter: location");
  });

  it("should handle extra unexpected fields in the input gracefully", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV57();
    const input = {
      toolName: "getWeather",
      parameters: {
        location: "London",
        unit: "celsius",
        extraField: "should_be_ignored",
      },
      metadata: {
        source: "user_input",
      }
    };
    const result = await pipeline.validate(input);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});