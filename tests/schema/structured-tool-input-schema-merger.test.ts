import { describe, it, expect } from "vitest";
import { SchemaMerger } from "../src/schema/structured-tool-input-schema-merger";
import { SchemaDefinition } from "../src/schema/types";

describe("SchemaMerger", () => {
  it("should return default empty schema and report when no schemas are provided", () => {
    const merger = new SchemaMerger();
    const result = merger.merge([]);
    expect(result.mergedSchema).toEqual({ properties: {}, required: [] } as SchemaDefinition);
    expect(result.report).toEqual({ conflicts: [], warnings: [] });
  });

  it("should correctly merge multiple non-conflicting schemas", () => {
    const merger = new SchemaMerger();
    const schema1: SchemaDefinition = {
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name"],
    };
    const schema2: SchemaDefinition = {
      properties: {
        email: { type: "string" },
        isActive: { type: "boolean" },
      },
      required: ["email"],
    };

    const result = merger.merge([schema1, schema2]);

    expect(result.mergedSchema.properties).toEqual({
      name: { type: "string" },
      age: { type: "number" },
      email: { type: "string" },
      isActive: { type: "boolean" },
    });
    expect(result.mergedSchema.required).toEqual(["name", "email"]);
    expect(result.report.conflicts).toEqual([]);
    expect(result.report.warnings).toEqual([]);
  });

  it("should handle basic property overwriting and required field aggregation", () => {
    const merger = new SchemaMerger();
    const schema1: SchemaDefinition = {
      properties: {
        id: { type: "string" },
        value: { type: "string" },
      },
      required: ["id"],
    };
    const schema2: SchemaDefinition = {
      properties: {
        value: { type: "number" }, // Overwrites type
        optionalField: { type: "boolean" },
      },
      required: ["value"],
    };

    const result = merger.merge([schema1, schema2]);

    expect(result.mergedSchema.properties).toEqual({
      id: { type: "string" },
      value: { type: "number" },
      optionalField: { type: "boolean" },
    });
    expect(result.mergedSchema.required).toEqual(["id", "value"]);
  });
});