import { describe, it, expect } from "vitest";
import {
  ValidationStep,
  ValidationResult,
  SchemaDefinition,
} from "../src/validation/structured-tool-input-validation-pipeline-v24";

describe("StructuredToolInputValidationPipelineV24", () => {
  it("should return valid result when input data matches the schema", async () => {
    // Mock implementation for testing purposes
    const mockPipeline: ValidationStep[] = [
      {
        name: "Step1",
        execute: async (data) => ({
          isValid: true,
          errors: [],
          validatedData: {
            requiredField: "testValue",
            optionalField: "someValue",
          },
        }),
      },
    ];

    const result = await mockPipeline.reduce(
      (accPromise, step) => accPromise.then(async (currentResult) => {
        const stepResult = await step.execute(currentResult.validatedData);
        return {
          isValid: currentResult.isValid && stepResult.isValid,
          errors: [...currentResult.errors, ...(stepResult.errors || [])],
          validatedData: stepResult.validatedData,
        };
      }),
      Promise.resolve({ isValid: true, errors: [], validatedData: {} })
    );

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.validatedData).toBeDefined();
  });

  it("should accumulate errors when multiple validation steps fail", async () => {
    // Mock implementation for testing purposes
    const mockPipeline: ValidationStep[] = [
      {
        name: "Step1",
        execute: async (data) => ({
          isValid: false,
          errors: ["Error in Step 1"],
          validatedData: {
            requiredField: "badValue",
            optionalField: "someValue",
          },
        }),
      },
      {
        name: "Step2",
        execute: async (data) => ({
          isValid: false,
          errors: ["Error in Step 2"],
          validatedData: {
            requiredField: "badValue",
            optionalField: "someValue",
          },
        }),
      },
    ];

    const result = await mockPipeline.reduce(
      (accPromise, step) => accPromise.then(async (currentResult) => {
        const stepResult = await step.execute(currentResult.validatedData);
        return {
          isValid: currentResult.isValid && stepResult.isValid,
          errors: [...currentResult.errors, ...(stepResult.errors || [])],
          validatedData: stepResult.validatedData,
        };
      }),
      Promise.resolve({ isValid: true, errors: [], validatedData: {} })
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error in Step 1", "Error in Step 2"]);
  });

  it("should pass the validated data from one step to the next", async () => {
    // Mock implementation for testing purposes
    const mockPipeline: ValidationStep[] = [
      {
        name: "Step1",
        execute: async (data) => ({
          isValid: true,
          errors: [],
          validatedData: {
            intermediateData: "dataFromStep1",
          },
        }),
      },
      {
        name: "Step2",
        execute: async (data) => ({
          isValid: true,
          errors: [],
          validatedData: {
            ...data,
            finalField: "dataFromStep2",
          },
        }),
      },
    ];

    const result = await mockPipeline.reduce(
      (accPromise, step) => accPromise.then(async (currentResult) => {
        const stepResult = await step.execute(currentResult.validatedData);
        return {
          isValid: currentResult.isValid && stepResult.isValid,
          errors: [...currentResult.errors, ...(stepResult.errors || [])],
          validatedData: stepResult.validatedData,
        };
      }),
      Promise.resolve({ isValid: true, errors: [], validatedData: {} })
    );

    expect(result.isValid).toBe(true);
    expect(result.validatedData).toHaveProperty("finalField", "dataFromStep2");
    expect(result.validatedData).toHaveProperty("intermediateData", "dataFromStep1");
  });
});