import { describe, it, expect } from "vitest";
import { ComplexConstraintValidator } from "../src/validation/structured-tool-input-validation-pipeline-v1014";

describe("ComplexConstraintValidator", () => {
  it("should initialize correctly with no rules", () => {
    const validator = new ComplexConstraintValidator();
    // Assuming there's a way to check internal state or methods,
    // for this test, we just check instantiation.
    expect(validator).toBeDefined();
  });

  it("should validate data against provided rules and return errors", () => {
    const rules: { fields: string[]; validator: (data: Record<string, unknown>) => string | null }[] = [
      {
        fields: ["requiredField"],
        validator: (data) => {
          if (!data["requiredField"] || String(data["requiredField"]).trim() === "") {
            return "requiredField is mandatory";
          }
          return null;
        },
      },
      {
        fields: ["numericField"],
        validator: (data) => {
          const value = data["numericField"];
          if (typeof value !== 'number' || isNaN(value)) {
            return "numericField must be a valid number";
          }
          return null;
        },
      },
    ];

    const validator = new ComplexConstraintValidator(rules);

    // Test case 1: Missing required field and wrong type
    const invalidData: Record<string, unknown> = {
      numericField: "not a number",
    };
    // We assume the validator has a method like validate(data) that returns ValidationResult
    // Since the method isn't provided, we'll mock the expected behavior based on the class structure.
    // For a real test, we'd call the actual validation method.
    // Assuming a method `validate(data)` exists and returns { isValid: boolean, errors: string[] }
    // For this example, we'll assert based on the rules defined.
    const result = validator['validate'](invalidData); // Accessing private/unimplemented method for structure
    expect(result?.isValid).toBe(false);
    expect(result?.errors).toContain("requiredField is mandatory");
    expect(result?.errors).toContain("numericField must be a valid number");
  });

  it("should pass validation when all data meets constraints", () => {
    const rules: { fields: string[]; validator: (data: Record<string, unknown>) => string | null }[] = [
      {
        fields: ["requiredField"],
        validator: (data) => {
          if (!data["requiredField"] || String(data["requiredField"]).trim() === "") {
            return "requiredField is mandatory";
          }
          return null;
        },
      },
      {
        fields: ["numericField"],
        validator: (data) => {
          const value = data["numericField"];
          if (typeof value !== 'number' || isNaN(value)) {
            return "numericField must be a valid number";
          }
          return null;
        },
      },
    ];

    const validator = new ComplexConstraintValidator(rules);

    // Test case 2: Valid data
    const validData: Record<string, unknown> = {
      requiredField: "some value",
      numericField: 123,
    };
    const result = validator['validate'](validData);
    expect(result?.isValid).toBe(true);
    expect(result?.errors).toEqual([]);
  });
});