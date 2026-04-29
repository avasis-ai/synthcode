import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidator } from "../src/validation/structured-tool-output-schema-validator-v1006";
import {
  StructuralRule,
} from "../src/validation/structured-tool-output-schema-validator-v1006";

describe("StructuredToolOutputSchemaValidator", () => {
  it("should initialize with provided rules", () => {
    const mockRule1: StructuralRule = {
      name: "rule1",
      validate: (data) => null,
    };
    const mockRule2: StructuralRule = {
      name: "rule2",
      validate: (data) => null,
    };
    const validator = new StructuredToolOutputSchemaValidator([mockRule1, mockRule2]);
    // We can't directly access private members, but we can test its usage pattern.
    // For this test, we assume the constructor correctly stores the rules.
    expect(validator).toBeDefined();
  });

  it("should validate data against all registered rules and collect errors", () => {
    const mockRule1: StructuralRule = {
      name: "valid-rule",
      validate: (data) => {
        if (data["field1"] === undefined) return ["Missing field1"];
        return null;
      },
    };
    const mockRule2: StructuralRule = {
      name: "another-rule",
      validate: (data) => {
        if (typeof data["field2"] !== "string") return ["Field2 must be a string"];
        return null;
      },
    };
    const validator = new StructuredToolOutputSchemaValidator([mockRule1, mockRule2]);

    // Test case where both rules pass
    const validData = { field1: "value1", field2: "value2" };
    const resultValid = validator.validate(validData);
    expect(resultValid.isValid).toBe(true);
    expect(resultValid.errors).toEqual([]);

    // Test case where both rules fail
    const invalidData = { field1: undefined, field2: 123 };
    const resultInvalid = validator.validate(invalidData);
    expect(resultInvalid.isValid).toBe(false);
    expect(resultInvalid.errors).toHaveLength(2);
    expect(resultInvalid.errors).toEqual(
      expect.arrayContaining(["Missing field1", "Field2 must be a string"])
    );
  });

  it("should return valid if no rules are provided", () => {
    const validator = new StructuredToolOutputSchemaValidator([]);
    const data = { any: "data" };
    const result = validator.validate(data);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});