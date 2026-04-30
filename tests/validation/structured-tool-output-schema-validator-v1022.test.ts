import { describe, it, expect } from "vitest";
import { validateStructuredToolOutputSchema } from "../src/validation/structured-tool-output-schema-validator-v1022";

describe("validateStructuredToolOutputSchema", () => {
  it("should return true for identical schemas", () => {
    const schema = {
      name: { type: "string", required: true, description: "The name" },
      count: { type: "number", required: false },
    };
    const result = validateStructuredToolOutputSchema(schema, schema);
    expect(result).toBe(true);
  });

  it("should detect added fields", () => {
    const oldSchema = {
      name: { type: "string", required: true },
    };
    const newSchema = {
      name: { type: "string", required: true },
      newField: { type: "boolean", required: false },
    };
    const result = validateStructuredToolOutputSchema(oldSchema, newSchema);
    expect(result.addedFields).toContain("newField");
    expect(result.removedFields).toHaveLength(0);
    expect(result.changedFields).toHaveLength(0);
  });

  it("should detect removed and changed fields", () => {
    const oldSchema = {
      name: { type: "string", required: true },
      optionalField: { type: "string", required: false },
    };
    const newSchema = {
      name: { type: "string", required: false },
      updatedField: { type: "number", required: true },
    };
    const result = validateStructuredToolOutputSchema(oldSchema, newSchema);
    expect(result.addedFields).toContain("updatedField");
    expect(result.removedFields).toContain("optionalField");
    expect(result.changedFields).toHaveLength(1);
    expect(result.changedFields["name"].oldSchema.required).toBe(true);
    expect(result.changedFields["name"].newSchema.required).toBe(false);
  });
});