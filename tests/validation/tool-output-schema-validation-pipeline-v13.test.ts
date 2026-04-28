import { describe, it, expect } from "vitest";
import { ToolOutputSchemaValidator } from "../src/validation/tool-output-schema-validation-pipeline-v13";

describe("ToolOutputSchemaValidator", () => {
  it("should initialize correctly with a schema", () => {
    const schema: Record<string, any> = {
      name: "string",
      age: "number",
    };
    const validator = new ToolOutputSchemaValidator(schema);
    expect(validator).toBeDefined();
  });

  it("should validate a correct output against the schema", () => {
    const schema: Record<string, any> = {
      id: "string",
      count: "number",
    };
    const validator = new ToolOutputSchemaValidator(schema);
    const validOutput = { id: "abc-123", count: 10 };
    const result = validator.validate(validOutput);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should report errors for missing or incorrect types in the output", () => {
    const schema: Record<string, any> = {
      requiredField: "string",
      optionalNumber: "number",
    };
    const validator = new ToolOutputSchemaValidator(schema);
    const invalidOutput = { requiredField: 123 }; // Wrong type for requiredField
    const result = validator.validate(invalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("requiredField");
  });
});