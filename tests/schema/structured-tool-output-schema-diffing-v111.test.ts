import { describe, it, expect } from "vitest";
import { SchemaField, SchemaDiff } from "../src/schema/structured-tool-output-schema-diffing-v111";

describe("SchemaDiff", () => {
  it("should correctly identify a type change", () => {
    const oldSchema: SchemaField = {
      type: "string",
      properties: {
        id: { type: "string" },
      },
    };
    const newSchema: SchemaField = {
      type: "object",
      properties: {
        id: { type: "number" },
      },
    };

    const diffs: SchemaDiff[] = diffSchemas(oldSchema, newSchema);

    expect(diffs).toHaveLength(1);
    expect(diffs[0].path).toBe("properties.id");
    expect(diffs[0].changeType).toBe("TYPE_CHANGE");
  });

  it("should correctly identify a field addition", () => {
    const oldSchema: SchemaField = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
    };
    const newSchema: SchemaField = {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
    };

    const diffs: SchemaDiff[] = diffSchemas(oldSchema, newSchema);

    expect(diffs).toHaveLength(1);
    expect(diffs[0].path).toBe("properties.email");
    expect(diffs[0].changeType).toBe("FIELD_ADDED");
  });

  it("should correctly identify a field removal", () => {
    const oldSchema: SchemaField = {
      type: "object",
      properties: {
        name: { type: "string" },
        optionalField: { type: "boolean" },
      },
    };
    const newSchema: SchemaField = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
    };

    const diffs: SchemaDiff[] = diffSchemas(oldSchema, newSchema);

    expect(diffs).toHaveLength(1];
    expect(diffs[0].path).toBe("properties.optionalField");
    expect(diffs[0].changeType).toBe("FIELD_REMOVED");
  });
});