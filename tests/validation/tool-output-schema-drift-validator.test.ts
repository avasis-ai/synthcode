import { describe, it, expect } from "vitest";
import { ToolOutputSchemaDriftValidator } from "../src/validation/tool-output-schema-drift-validator";

describe("ToolOutputSchemaDriftValidator", () => {
  it("should return valid when the output matches the expected schema", () => {
    const expectedSchema: any = {
      name: { required: true, type: "string" },
      count: { required: false, type: "number" },
      isActive: { required: true, type: "boolean" },
    };
    const validator = new ToolOutputSchemaDriftValidator(expectedSchema);
    const output = { name: "test", isActive: true, count: 10 };
    const result = validator.validate(output);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect missing required fields", () => {
    const expectedSchema: any = {
      name: { required: true, type: "string" },
      age: { required: true, type: "number" },
    };
    const validator = new ToolOutputSchemaDriftValidator(expectedSchema);
    const output = { name: "test" }; // Missing 'age'
    const result = validator.validate(output);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field: age");
  });

  it("should detect incorrect data types", () => {
    const expectedSchema: any = {
      id: { required: true, type: "number" },
      description: { required: true, type: "string" },
    };
    const validator = new ToolOutputSchemaDriftValidator(expectedSchema);
    const output = { id: "123", description: 456 }; // id is string, description is number
    const result = validator.validate(output);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Type mismatch for field 'id': Expected number, got string");
    expect(result.errors).toContain("Type mismatch for field 'description': Expected string, got number");
  });
});