import { describe, it, expect } from "vitest";
import { AdvancedSchemaValidator } from "../src/validation/structured-tool-output-schema-validator-v1013-advanced";

describe("AdvancedSchemaValidator", () => {
  it("should validate a simple object structure correctly", () => {
    const schema: AdvancedSchema = {
      type: "object",
      properties: {
        id: { type: "string" },
        count: { type: "number" },
      },
      required: ["id", "count"],
    };
    const data = { id: "test-123", count: 42 };
    const validator = new AdvancedSchemaValidator(schema);
    expect(validator.isValid(data)).toBe(true);
  });

  it("should fail validation when a required field is missing", () => {
    const schema: AdvancedSchema = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name", "age"],
    };
    const validator = new AdvancedSchemaValidator(schema);
    const data = { name: "Alice" };
    expect(validator.isValid(data)).toBe(false);
  });

  it("should handle conditional validation rules", () => {
    const schema: AdvancedSchema = {
      type: "object",
      properties: {
        status: { type: "string" },
        reason: {
          type: "object",
          properties: {
            details: { type: "string" },
          },
          required: ["details"],
          if: {
            field: "status",
            operator: "==",
            value: "FAILED",
          },
          then: {
            field: "reason",
            required: true,
            type: "object",
          },
        },
      },
      required: ["status"],
    };
    const validator = new AdvancedSchemaValidator(schema);

    // Case 1: Status is not FAILED, reason is optional/missing (should pass if not required)
    const dataPass = { status: "SUCCESS" };
    expect(validator.isValid(dataPass)).toBe(true);

    // Case 2: Status is FAILED, but reason is missing (should fail due to conditional requirement)
    const dataFail = { status: "FAILED" };
    expect(validator.isValid(dataFail)).toBe(false);

    // Case 3: Status is FAILED, and reason is present and valid
    const dataPassConditional = { status: "FAILED", reason: { details: "Invalid input" } };
    expect(validator.isValid(dataPassConditional)).toBe(true);
  });
});