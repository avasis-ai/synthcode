import { describe, it, expect } from "vitest";
import {
  ValidationPipeline,
  ValidationContext,
  ValidationResult,
  ValidationStep,
} from "../src/validation/structured-tool-output-validation-pipeline-v59";

describe("ValidationPipeline", () => {
  it("should return valid result for correctly structured tool output", async () => {
    const context: ValidationContext = {
      inputData: { toolOutput: '{"key": "value", "number": 123}' },
      history: [],
      previousStepResult: null,
      contextData: {},
    };
    const pipeline = new ValidationPipeline();
    const result: ValidationResult = await pipeline.validate(context);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(typeof result.data).toBe("object");
  });

  it("should return invalid result with errors for missing required fields", async () => {
    const context: ValidationContext = {
      inputData: { toolOutput: '{"key": "value"}' }, // Missing 'number'
      history: [],
      previousStepResult: null,
      contextData: {},
    };
    const pipeline = new ValidationPipeline();
    const result: ValidationResult = await pipeline.validate(context);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Missing required field: number");
  });

  it("should correctly process context data when available", async () => {
    const context: ValidationContext = {
      inputData: { toolOutput: '{"key": "value", "contextKey": "contextValue"}' },
      history: [{ type: "user", content: "Test" }],
      previousStepResult: { isValid: true, errors: [], data: { contextKey: "contextValue" } },
      contextData: { contextKey: "contextValue" },
    };
    const pipeline = new ValidationPipeline();
    const result: ValidationResult = await pipeline.validate(context);

    expect(result.isValid).toBe(true);
    expect(result.data).toEqual({
      key: "value",
      contextKey: "contextValue",
    });
  });
});