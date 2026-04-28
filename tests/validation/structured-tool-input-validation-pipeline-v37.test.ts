import { describe, it, expect } from "vitest";
import { ValidationPipeline, ValidationContext, ValidationResult } from "../src/validation/structured-tool-input-validation-pipeline-v37";

describe("ValidationPipeline", () => {
  it("should return valid result for correctly structured input", () => {
    const context: ValidationContext = {
      input: { tool_name: "get_weather", parameters: { location: "New York" } },
      data: { user_id: "user123" },
    };
    const pipeline = new ValidationPipeline();
    const result: ValidationResult = pipeline.validate(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid result with specific errors for missing required fields", () => {
    const context: ValidationContext = {
      input: { tool_name: "get_weather", parameters: {} },
      data: { user_id: "user123" },
    };
    const pipeline = new ValidationPipeline();
    const result: ValidationResult = pipeline.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required parameter: location for tool get_weather");
  });

  it("should handle context data discrepancies gracefully", () => {
    const context: ValidationContext = {
      input: { tool_name: "create_user", parameters: { email: "test@example.com" } },
      data: { user_id: "user123", role: "admin" },
    };
    // Assuming the pipeline has a step that checks context.data
    const pipeline = new ValidationPipeline();
    const result: ValidationResult = pipeline.validate(context);
    // This test assumes the pipeline logic correctly processes context.data if needed
    expect(result.isValid).toBe(true); // Adjust expectation based on actual pipeline behavior for this case
  });
});