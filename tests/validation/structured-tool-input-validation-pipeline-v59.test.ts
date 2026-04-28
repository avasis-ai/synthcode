import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipeline } from "../src/validation/structured-tool-input-validation-pipeline-v59";

describe("StructuredToolInputValidationPipeline", () => {
  it("should return valid data when all steps pass validation", () => {
    const mockStep1: any = {
      validate: (input: any, context: any) => ({
        isValid: true,
        errors: [],
        validatedData: { name: "TestName" },
      }),
    };
    const mockStep2: any = {
      validate: (input: any, context: any) => ({
        isValid: true,
        errors: [],
        validatedData: { age: 30 },
      }),
    };

    const pipeline = new StructuredToolInputValidationPipeline([mockStep1, mockStep2]);
    const result = pipeline.validate({ name: "TestName", age: 30 }, {});

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.validatedData).toEqual({ name: "TestName", age: 30 });
  });

  it("should accumulate errors when any step fails validation", () => {
    const mockStep1: any = {
      validate: (input: any, context: any) => ({
        isValid: true,
        errors: [],
        validatedData: { name: "TestName" },
      }),
    };
    const mockStep2: any = {
      validate: (input: any, context: any) => ({
        isValid: false,
        errors: ["Age must be positive"],
        validatedData: {},
      }),
    };

    const pipeline = new StructuredToolInputValidationPipeline([mockStep1, mockStep2]);
    const result = pipeline.validate({ name: "TestName", age: -5 }, {});

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Age must be positive"]);
    expect(result.validatedData).toEqual({ name: "TestName" });
  });

  it("should return the initial input if no steps are provided", () => {
    const pipeline = new StructuredToolInputValidationPipeline([]);
    const input = { key: "value" };
    const result = pipeline.validate(input, {});

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.validatedData).toEqual(input);
  });
});