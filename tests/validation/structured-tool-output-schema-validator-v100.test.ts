import { describe, it, expect } from "vitest";
import { StructuredOutputSchemaValidator } from "../src/validation/structured-tool-output-schema-validator-v100";

describe("StructuredOutputSchemaValidator", () => {
  it("should validate a correctly structured tool output against a simple schema", () => {
    const schema: Record<string, any> = {
      primary_result: { type: "object", required: true },
      metadata: { type: "object", required: false },
      blocks: { type: "array", required: true, itemSchema: { type: "object" } },
    };
    const validator = new StructuredOutputSchemaValidator(schema);

    const validOutput = {
      primary_result: { key: "value" },
      blocks: [{ type: "text", content: "Some text" }],
    };

    const result = validator.validate(validOutput);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail validation when primary_result is missing", () => {
    const schema: Record<string, any> = {
      primary_result: { type: "object", required: true },
      blocks: { type: "array", required: true, itemSchema: { type: "object" } },
    };
    const validator = new StructuredOutputSchemaValidator(schema);

    const invalidOutput = {
      blocks: [{ type: "text", content: "Some text" }],
    };

    const result = validator.validate(invalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field: primary_result");
  });

  it("should fail validation when blocks is not an array", () => {
    const schema: Record<string, any> = {
      primary_result: { type: "object", required: true },
      blocks: { type: "array", required: true, itemSchema: { type: "object" } },
    };
    const validator = new StructuredOutputSchemaValidator(schema);

    const invalidOutput = {
      primary_result: { key: "value" },
      blocks: "not an array",
    };

    const result = validator.validate(invalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Field 'blocks' must be an array");
  });
});