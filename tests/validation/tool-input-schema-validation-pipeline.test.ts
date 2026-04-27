import { describe, it, expect } from "vitest";
import { ToolInputSchemaValidationPipeline } from "../src/validation/tool-input-schema-validation-pipeline";

describe("ToolInputSchemaValidationPipeline", () => {
  it("should return all validators' results when validating a valid input", () => {
    // Mock validators for testing purposes
    const mockValidator1: any = {
      validate: (input: Record<string, unknown>) => ({ isValid: true, errors: [] }),
    };
    const mockValidator2: any = {
      validate: (input: Record<string, unknown>) => ({ isValid: true, errors: [] }),
    };

    const pipeline = new ToolInputSchemaValidationPipeline([mockValidator1, mockValidator2]);
    const result = pipeline.validate({});

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should aggregate errors from multiple validators when input is invalid", () => {
    // Mock validators to return specific errors
    const mockValidator1: any = {
      validate: (input: Record<string, unknown>) => ({ isValid: false, errors: ["Error from validator 1"] }),
    };
    const mockValidator2: any = {
      validate: (input: Record<string, unknown>) => ({ isValid: false, errors: ["Error from validator 2"] }),
    };

    const pipeline = new ToolInputSchemaValidationPipeline([mockValidator1, mockValidator2]);
    const result = pipeline.validate({});

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error from validator 1", "Error from validator 2"]);
  });

  it("should correctly report validation details for each validator", () => {
    // Mock validators to return specific results
    const mockValidator1: any = {
      validate: (input: Record<string, unknown>) => ({ isValid: true, errors: [] }),
    };
    const mockValidator2: any = {
      validate: (input: Record<string, unknown>) => ({ isValid: false, errors: ["Specific error"] }),
    };

    const pipeline = new ToolInputSchemaValidationPipeline([mockValidator1, mockValidator2]);
    const result = pipeline.validate({});

    expect(result.details).toHaveLength(2);
    expect(result.details[0].validatorName).toBe("validator1"); // Assuming validator names are set/mocked correctly
    expect(result.details[1].validatorName).toBe("validator2");
    expect(result.details[1].result.isValid).toBe(false);
  });
});