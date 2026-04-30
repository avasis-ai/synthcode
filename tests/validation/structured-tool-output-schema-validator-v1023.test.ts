import { describe, it, expect } from "vitest";
import { StructuredValidator } from "../src/validation/structured-tool-output-schema-validator-v1023";

describe("StructuredValidator", () => {
  it("should validate correctly when data matches the schema", () => {
    const mockValidator: StructuredValidator<any> = {
      validate: (data, context) => ({ isValid: true, errors: [] }),
    };
    const context = { messages: [], schema: {}, history: [] };
    const result = mockValidator.validate({}, context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should report errors when data does not match the schema", () => {
    const mockValidator: StructuredValidator<any> = {
      validate: (data, context) => ({ isValid: false, errors: ["Field X is missing"] }),
    };
    const context = { messages: [], schema: {}, history: [] };
    const result = mockValidator.validate({}, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Field X is missing");
  });

  it("should handle empty data gracefully", () => {
    const mockValidator: StructuredValidator<any> = {
      validate: (data, context) => {
        if (!data) {
          return { isValid: false, errors: ["Data cannot be empty"] };
        }
        return { isValid: true, errors: [] };
      },
    };
    const context = { messages: [], schema: {}, history: [] };
    const result = mockValidator.validate(null, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Data cannot be empty");
  });
});