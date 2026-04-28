import { describe, it, expect } from "vitest";
import { SchemaMerger } from "../src/schema/structured-tool-output-schema-merger-v10";
import { SchemaDefinition, MergeOptions } from "../src/schema/types";

describe("SchemaMerger", () => {
  it("should merge two simple schemas correctly", () => {
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
    const options: MergeOptions = {
      overwrite: true,
    };

    const merger = new SchemaMerger([schema1, schema2], options);
    const { schema, report } = merger.merge();

    expect(schema.properties).toHaveProperty("name");
    expect(schema.properties).toHaveProperty("email");
    expect(schema.properties.age).toEqual({ type: "number" });
    expect(report.warnings).toHaveLength(0);
  });

  it("should handle conflicting types by prioritizing the first schema's type if overwrite is false", () => {
    const schema1: SchemaDefinition = {
      type: "object",
      properties: {
        id: { type: "string" },
      },
    };
    const schema2: SchemaDefinition = {
      type: "object",
      properties: {
        id: { type: "number" },
      },
    };
    const options: MergeOptions = {
      overwrite: false,
    };

    const merger = new SchemaMerger([schema1, schema2], options);
    const { schema, report } = merger.merge();

    expect(schema.properties.id).toEqual({ type: "string" });
    expect(report.warnings).toHaveLength(1);
    expect(report.warnings[0].message).toContain("Type conflict for 'id'");
  });

  it("should merge multiple schemas and report all conflicts", () => {
    const schema1: SchemaDefinition = {
      type: "object",
      properties: {
        a: { type: "string" },
      },
    };
    const schema2: SchemaDefinition = {
      type: "object",
      properties: {
        b: { type: "boolean" },
      },
    };
    const schema3: SchemaDefinition = {
      type: "object",
      properties: {
        a: { type: "number" },
      },
    };
    const options: MergeOptions = {
      overwrite: true,
    };

    const merger = new SchemaMerger([schema1, schema2, schema3], options);
    const { schema, report } = merger.merge();

    expect(schema.properties).toHaveProperty("a");
    expect(schema.properties).toHaveProperty("b");
    expect(schema.properties.a).toEqual({ type: "number" });
    expect(report.warnings).toHaveLength(1);
    expect(report.warnings[0].message).toContain("Type conflict for 'a'");
  });
});