import { describe, it, expect } from "vitest";
import { StructuredToolInputSchemaValidator } from "../src/validation/structured-tool-input-schema-validator-v38";

describe("StructuredToolInputSchemaValidator", () => {
  it("should validate data against a simple schema correctly", () => {
    const schema = {
      name: { type: "string", required: true },
      age: { type: "number", required: false },
    };
    const validator = new StructuredToolInputSchemaValidator(schema, []);

    // Test case 1: Valid data
    const validData = { name: "TestUser", age: 30 };
    expect(validator.validate(validData)).toBeUndefined();

    // Test case 2: Missing required field
    const invalidData = { name: "TestUser" };
    // Manually adjust the test case to ensure the validator handles missing required fields if the implementation supports it.
    // Based on the provided snippet, we assume the validator checks for required fields.
    const missingRequiredSchema = {
      name: { type: "string", required: true },
      email: { type: "string", required: true },
    };
    const validator2 = new StructuredToolInputSchemaValidator(missingRequiredSchema, []);
    expect(validator2.validate({ name: "TestUser" as any })).toBe("Missing required field: email");
  });

  it("should return undefined for valid data when no cross-field validators are present", () => {
    const schema = {
      id: { type: "string", required: true },
      value: { type: "number", required: true },
    };
    const validator = new StructuredToolInputSchemaValidator(schema, []);

    const validData = { id: "abc", value: 123 };
    expect(validator.validate(validData)).toBeUndefined();
  });

  it("should use cross-field validators when provided", () => {
    const schema = {
      startDate: { type: "string", required: true },
      endDate: { type: "string", required: true },
    };

    const crossFieldValidator: any = {
      validate: (data: any) => {
        if (new Date(data.startDate) > new Date(data.endDate)) {
          return "Start date cannot be after end date";
        }
        return undefined;
      },
    };

    const validator = new StructuredToolInputSchemaValidator(schema, [crossFieldValidator]);

    // Test case 1: Valid dates
    const validData = { startDate: "2023-01-01", endDate: "2023-01-31" };
    expect(validator.validate(validData)).toBeUndefined();

    // Test case 2: Invalid date order (should trigger cross-field validation)
    const invalidData = { startDate: "2023-01-31", endDate: "2023-01-01" };
    expect(validator.validate(invalidData)).toBe("Start date cannot be after end date");
  });
});