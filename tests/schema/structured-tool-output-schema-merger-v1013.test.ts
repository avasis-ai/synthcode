import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMergerV1013 } from "../src/schema/structured-tool-output-schema-merger-v1013";
import { SchemaDefinition, FieldDefinition, ConflictResolutionStrategy } from "../src/schema/types";

describe("StructuredToolOutputSchemaMergerV1013", () => {
  it("should merge two simple schemas with 'union' strategy correctly", () => {
    const schema1: SchemaDefinition = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
    };
    const schema2: SchemaDefinition = {
      type: "object",
      properties: {
        email: { type: "string" },
        age: { type: "number" },
      },
    };

    const merger = new StructuredToolOutputSchemaMergerV1013("union");
    const { mergedSchema, report } = merger.merge([schema1, schema2]);

    expect(mergedSchema.type).toBe("object");
    expect(mergedSchema.properties).toHaveProperty("name");
    expect(mergedSchema.properties).toHaveProperty("email");
    expect(mergedSchema.properties).toHaveProperty("age");
    expect(report.conflicts).toHaveLength(1);
    expect(report.conflicts[0].field).toBe("age");
  });

  it("should handle conflicting types with 'overwrite' strategy", () => {
    const schema1: SchemaDefinition = {
      type: "object",
      properties: {
        id: { type: "string" },
      },
    };
    const schema2: SchemaDefinition = {
      type: "object",
      properties: {
        id: { type: "integer" }, // Conflict
      },
    };

    const merger = new StructuredToolOutputSchemaMergerV1013("overwrite");
    const { mergedSchema, report } = merger.merge([schema1, schema2]);

    expect(mergedSchema.properties.id.type).toBe("integer");
    expect(report.conflicts).toHaveLength(1);
    expect(report.conflicts[0].field).toBe("id");
  });

  it("should return an empty schema and report when given no schemas", () => {
    const merger = new StructuredToolOutputSchemaMergerV1013("union");
    const { mergedSchema, report } = merger.merge([]);

    expect(mergedSchema).toEqual({ type: "object", properties: {} });
    expect(report.conflicts).toHaveLength(0);
    expect(report.merged).toBe(false);
  });
});