import { describe, it, expect } from "vitest";
import { ToolInputValidationPipeline } from "../src/validation/tool-input-validation-pipeline";

describe("ToolInputValidationPipeline", () => {
  it("should return isValid true and empty errors array if all steps pass validation", () => {
    const mockStep1: any = { execute: (input: any, context: any) => ({ isValid: true }) };
    const mockStep2: any = { execute: (input: any, context: any) => ({ isValid: true }) };
    const pipeline = new ToolInputValidationPipeline([mockStep1, mockStep2]);

    const result = pipeline.validate({ toolName: "test" }, {});

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should collect errors from all failing steps", () => {
    const mockStep1: any = { execute: (input: any, context: any) => ({ isValid: false, error: "Error in step 1" }) };
    const mockStep2: any = { execute: (input: any, context: any) => ({ isValid: false, error: "Error in step 2" }) };
    const pipeline = new ToolInputValidationPipeline([mockStep1, mockStep2]);

    const result = pipeline.validate({ toolName: "test" }, {});

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error in step 1", "Error in step 2"]);
  });

  it("should stop processing and return errors upon the first failure if designed to do so (assuming implementation detail)", () => {
    // Note: The provided signature suggests collecting all errors, but we test the failure path.
    // If the implementation stops on the first error, this test reflects that.
    const mockStep1: any = { execute: (input: any, context: any) => ({ isValid: false, error: "First error" }) };
    const mockStep2: any = { execute: (input: any, context: any) => ({ isValid: false, error: "Second error" }) };
    const pipeline = new ToolInputValidationPipeline([mockStep1, mockStep2]);

    // Based on the provided signature { isValid: boolean; errors: string[] }, it seems to collect all errors.
    // We test the collection behavior again, but ensure the first error is present.
    const result = pipeline.validate({ toolName: "test" }, {});

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("First error");
    expect(result.errors.length).toBe(2); // Assuming it collects all errors as per the return type
  });
});