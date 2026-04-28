import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidator } from "../src/validation/structured-tool-output-validation-pipeline-v28";

describe("StructuredToolOutputValidator", () => {
  it("should correctly validate output when all steps pass", async () => {
    // Mock dependencies for testing
    const mockSchemaValidator = { validate: async () => ({ isValid: true, errors: [] }) };
    const mockTemporalValidator = { validate: async () => ({ isValid: true, errors: [] }) };

    const validator = new StructuredToolOutputValidator(
      mockSchemaValidator as any,
      mockTemporalValidator as any
    );

    const mockOutput = { data: "valid_data", timestamp: "2023-01-01T00:00:00Z" };
    const result = await validator.validate(mockOutput);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail validation if schema validation fails", async () => {
    // Mock dependencies for testing
    const mockSchemaValidator = { validate: async () => ({ isValid: false, errors: ["Schema mismatch"] }) };
    const mockTemporalValidator = { validate: async () => ({ isValid: true, errors: [] }) } as any;

    const validator = new StructuredToolOutputValidator(
      mockSchemaValidator,
      mockTemporalValidator
    );

    const mockOutput = { data: "invalid_data", timestamp: "2023-01-01T00:00:00Z" };
    const result = await validator.validate(mockOutput);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Schema mismatch");
  });

  it("should fail validation if temporal consistency check fails", async () => {
    // Mock dependencies for testing
    const mockSchemaValidator = { validate: async () => ({ isValid: true, errors: [] }) } as any;
    const mockTemporalValidator = { validate: async () => ({ isValid: false, errors: ["Time inconsistency"] }) };

    const validator = new StructuredToolOutputValidator(
      mockSchemaValidator,
      mockTemporalValidator
    );

    const mockOutput = { data: "valid_data", timestamp: "2023-01-01T00:00:00Z" };
    const result = await validator.validate(mockOutput);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Time inconsistency");
  });
});