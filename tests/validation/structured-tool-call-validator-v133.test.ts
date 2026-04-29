import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorV133 } from "../src/validation/structured-tool-call-validator-v133";

describe("StructuredToolCallValidatorV133", () => {
  it("should return invalid if schema is null or not an object", () => {
    const validator = new StructuredToolCallValidatorV133();
    const result = validator.validate({}, null as any);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Schema must be a non-null object.");
  });

  it("should validate a simple valid schema", () => {
    const validator = new StructuredToolCallValidatorV133();
    const schema: any = {
      type: "object",
      properties: {
        name: { type: "string" },
        count: { type: "number" },
      },
      required: ["name"],
    };
    const args: any = { name: "test", count: 10 };
    const result = validator.validate(args, schema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should report errors for missing required fields and incorrect types", () => {
    const validator = new StructuredToolCallValidatorV133();
    const schema: any = {
      type: "object",
      properties: {
        requiredField: { type: "string" },
        optionalNumber: { type: "number" },
      },
      required: ["requiredField"],
    };
    const args: any = { requiredField: 123 }; // Incorrect type for requiredField
    const result = validator.validate(args, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Field 'requiredField' must be a string.");
    expect(result.errors).toContain("Missing required field: requiredField");
  });
});