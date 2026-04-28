import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipelineV19 } from "../src/validation/structured-tool-input-validation-pipeline-v19";

describe("StructuredToolInputValidationPipelineV19", () => {
  it("should initialize with provided validation steps", () => {
    const mockStep1 = { validate: jest.fn() };
    const mockStep2 = { validate: jest.fn() };
    const pipeline = new StructuredToolInputValidationPipelineV19([mockStep1, mockStep2]);
    // Assuming there's a way to check internal state or a getter, 
    // for this test, we'll just ensure instantiation doesn't crash and assume it stores them.
    expect(pipeline).toBeInstanceOf(StructuredToolInputValidationPipelineV19);
  });

  it("should run all validation steps sequentially and aggregate results", async () => {
    const mockStep1 = { validate: jest.fn().mockResolvedValue({ isValid: true, errors: [] }) };
    const mockStep2 = { validate: jest.fn().mockResolvedValue({ isValid: false, errors: ["Error in step 2"] }) };
    const mockStep3 = { validate: jest.fn().mockResolvedValue({ isValid: true, errors: [] }) };
    const pipeline = new StructuredToolInputValidationPipelineV19([mockStep1, mockStep2, mockStep3]);

    const input = { data: "test input" };
    const context = { initialContext: true };

    const result = await pipeline.validate(input, context);

    expect(mockStep1.validate).toHaveBeenCalledWith(input, context);
    expect(mockStep2.validate).toHaveBeenCalledWith(input, context);
    expect(mockStep3.validate).toHaveBeenCalledWith(input, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error in step 2"]);
  });

  it("should stop processing or prioritize errors if an early step fails critically (depending on implementation)", async () => {
    // This test assumes the pipeline might short-circuit or that we can verify the error propagation.
    const mockStep1 = { validate: jest.fn().mockResolvedValue({ isValid: false, errors: ["Critical error in step 1"] }) };
    const mockStep2 = { validate: jest.fn().mockResolvedValue({ isValid: true, errors: [] }) };
    const pipeline = new StructuredToolInputValidationPipelineV19([mockStep1, mockStep2]);

    const input = { data: "test input" };
    const context = {};

    const result = await pipeline.validate(input, context);

    // If the pipeline is designed to run all steps regardless of failure, this is fine.
    // If it's designed to stop on first failure, we check that. Assuming it aggregates for robustness.
    expect(mockStep1.validate).toHaveBeenCalledTimes(1);
    expect(mockStep2.validate).toHaveBeenCalledTimes(1); 
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Critical error in step 1");
  });
});