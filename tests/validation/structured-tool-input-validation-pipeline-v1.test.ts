import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipeline } from "../src/validation/structured-tool-input-validation-pipeline-v1";

describe("StructuredToolInputValidationPipeline", () => {
  it("should return valid if all steps pass validation", () => {
    const mockStep1: any = { execute: (context) => ({ isValid: true, errors: [] }) };
    const mockStep2: any = { execute: (context) => ({ isValid: true, errors: [] }) };
    const pipeline = new StructuredToolInputValidationPipeline([mockStep1, mockStep2]);

    const result = pipeline.validate({ input: { key: "value" }, context: {} });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should aggregate errors from all failing steps", () => {
    const mockStep1: any = { execute: (context) => ({ isValid: false, errors: ["Error A"] }) };
    const mockStep2: any = { execute: (context) => ({ isValid: false, errors: ["Error B"] }) };
    const pipeline = new StructuredToolInputValidationPipeline([mockStep1, mockStep2]);

    const result = pipeline.validate({ input: {}, context: {} });

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining(["Error A", "Error B"]));
    expect(result.errors).toHaveLength(2);
  });

  it("should stop processing or include errors from all steps even if one fails early", () => {
    const mockStep1: any = { execute: (context) => ({ isValid: false, errors: ["Early Error"] }) };
    const mockStep2: any = { execute: (context) => ({ isValid: false, errors: ["Later Error"] }) };
    const pipeline = new StructuredToolInputValidationPipeline([mockStep1, mockStep2]);

    const result = pipeline.validate({ input: {}, context: {} });

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining(["Early Error", "Later Error"]));
    expect(result.errors).toHaveLength(2);
  });
});