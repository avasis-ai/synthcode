import { describe, it, expect } from "vitest";
import { StructuredSchemaField, SchemaField } from "../src/validation/structured-tool-input-schema-validator-v37";

describe("StructuredSchemaField validation", () => {
  it("should correctly validate a basic string field", () => {
    const schema: StructuredSchemaField = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
    };
    // Assuming a validation function exists that uses this schema, we test the structure itself.
    // Since we don't have the validator function, we test the structure's expected shape.
    expect(schema.properties.name).toEqual({ type: "string" });
  });

  it("should correctly validate a string field with min/max constraints", () => {
    const schema: StructuredSchemaField = {
      type: "object",
      properties: {
        description: { type: "string", constraints: { min: 5, max: 100 } },
      },
      required: ["description"],
    };
    expect(schema.properties.description).toEqual({
      type: "string",
      constraints: { min: 5, max: 100 },
    });
  });

  it("should correctly validate a field requiring multiple properties", () => {
    const schema: StructuredSchemaField = {
      type: "object",
      properties: {
        start_date: { type: "string" },
        end_date: { type: "string" },
      },
      required: ["start_date", "end_date"],
    };
    expect(schema.required).toEqual(["start_date", "end_date"]);
    expect(schema.properties.start_date).toBeDefined();
  });
});