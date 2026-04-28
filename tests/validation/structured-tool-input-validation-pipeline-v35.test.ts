import { describe, it, expect } from "vitest";
import {
  ValidationContext,
  ValidationResult,
  ValidationStep,
} from "../src/validation/structured-tool-input-validation-pipeline-v35";

const mockContext: ValidationContext = {
  input: {
    toolName: "mockTool",
    parameters: {
      param1: "value1",
      param2: 123,
    },
  },
  history: [
    { role: "user", content: "some message" },
  ],
  metadata: {
    userId: "user123",
  },
};

const mockStep: ValidationStep = {
  name: "mockStep",
  validateSync(context: ValidationContext): ValidationResult {
    if (context.input.toolName === "failTool") {
      return {
        isValid: false,
        errors: ["Tool name must be valid."],
        warnings: [],
      };
    }
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  },
  validateAsync(context: ValidationContext): Promise<ValidationResult> {
    return Promise.resolve({
      isValid: true,
      errors: [],
      warnings: [],
    });
  },
};

describe("StructuredToolInputValidationPipelineV35", () => {
  it("should pass validation when all steps are valid synchronously", async () => {
    const pipeline: ValidationStep[] = [mockStep];
    const result = await pipeline.reduce(
      (accPromise: Promise<ValidationResult>, step: ValidationStep) =>
        accPromise.then((currentResult) => {
          if (!currentResult.isValid) return currentResult;
          return step.validateSync(mockContext);
        }),
      Promise.resolve({ isValid: true, errors: [], warnings: [] })
    );

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail validation and stop on the first synchronous error", async () => {
    const failingStep: ValidationStep = {
      name: "failingStep",
      validateSync(context: ValidationContext): ValidationResult {
        return {
          isValid: false,
          errors: ["Required field missing."],
          warnings: [],
        };
      },
      validateAsync(context: ValidationContext): Promise<ValidationResult> {
        return Promise.resolve({
          isValid: true,
          errors: [],
          warnings: [],
        });
      },
    };
    const pipeline: ValidationStep[] = [mockStep, failingStep];
    const result = await pipeline.reduce(
      (accPromise: Promise<ValidationResult>, step: ValidationStep) =>
        accPromise.then((currentResult) => {
          if (!currentResult.isValid) return currentResult;
          return step.validateSync(mockContext);
        }),
      Promise.resolve({ isValid: true, errors: [], warnings: [] })
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Required field missing."]);
  });

  it("should handle an empty validation pipeline gracefully", async () => {
    const pipeline: ValidationStep[] = [];
    const result = await pipeline.reduce(
      (accPromise: Promise<ValidationResult>, step: ValidationStep) =>
        accPromise.then((currentResult) => {
          if (!currentResult.isValid) return currentResult;
          return step.validateSync(mockContext);
        }),
      Promise.resolve({ isValid: true, errors: [], warnings: [] })
    );

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});