import { describe, it, expect } from "vitest";
import { ToolOutputSchemaValidator } from "../src/tools/tool-output-schema-validator";

describe("ToolOutputSchemaValidator", () => {
  it("should return success when the output matches the schema", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name", "age"],
    };
    const validator = new ToolOutputSchemaValidator(schema);
    const validOutput = { name: "Test", age: 30 };
    const result = validator.validate(validOutput);
    expect(result.success).toBe(true);
  });

  it("should return failure with an error message when the output is missing a required field", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name", "age"],
    };
    const validator = new ToolOutputSchemaValidator(schema);
    const invalidOutput = { name: "Test" };
    const result = validator.validate(invalidOutput);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should return failure when the output type does not match the schema", () => {
    const schema = {
      type: "object",
      properties: {
        id: { type: "integer" },
      },
      required: ["id"],
    };
    const validator = new ToolOutputSchemaValidator(schema);
    const invalidOutput = { id: "not-an-integer" };
    const result = validator.validate(invalidOutput);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});