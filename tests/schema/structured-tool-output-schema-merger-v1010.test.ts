import { describe, it, expect } from "vitest";
import { SchemaMerger } from "../src/schema/structured-tool-output-schema-merger-v1010";
import {
  SchemaDefinition,
  MergeStrategy,
  MergeReport,
} from "../src/schema/types";

describe("SchemaMerger", () => {
  it("should merge two simple schemas correctly with 'union' strategy", () => {
    const schema1: SchemaDefinition = {
      type: "object",
      properties: {
        id: {type: "string"},
        name: {type: "string"},
      },
    };
    const schema2: SchemaDefinition = {
      type: "object",
      properties: {
        name: {type: "string"},
        email: {type: "string"},
      },
    };

    const merger = new SchemaMerger([schema1, schema2], "union");
    const { mergedSchema, report } = merger.merge();

    expect(mergedSchema.type).toBe("object");
    expect(mergedSchema.properties).toHaveProperty("id");
    expect(mergedSchema.properties).toHaveProperty("name");
    expect(mergedSchema.properties).toHaveProperty("email");
    expect(report.warnings).toHaveLength(1);
  });

  it("should handle overlapping properties with 'overwrite' strategy", () => {
    const schema1: SchemaDefinition = {
      type: "object",
      properties: {
        commonField: {type: "string", description: "First definition"},
        uniqueField1: {type: "integer"},
      },
    };
    const schema2: SchemaDefinition = {
      type: "object",
      properties: {
        commonField: {type: "string", description: "Second definition"},
        uniqueField2: {type: "boolean"},
      },
    };

    const merger = new SchemaMerger([schema1, schema2], "overwrite");
    const { mergedSchema, report } = merger.merge();

    expect(mergedSchema.properties).toHaveProperty("commonField");
    expect(mergedSchema.properties.commonField).toEqual({
      type: "string",
      description: "Second definition",
    });
    expect(mergedSchema.properties).toHaveProperty("uniqueField1");
    expect(mergedSchema.properties).toHaveProperty("uniqueField2");
    expect(report.warnings).toHaveLength(1);
  });

  it("should merge multiple schemas and report all conflicts", () => {
    const schema1: SchemaDefinition = {
      type: "object",
      properties: {
        a: {type: "string"},
      },
    };
    const schema2: SchemaDefinition = {
      type: "object",
      properties: {
        a: {type: "number"},
      },
    };
    const schema3: SchemaDefinition = {
      type: "object",
      properties: {
        b: {type: "boolean"},
      },
    };

    const merger = new SchemaMerger([schema1, schema2, schema3], "union");
    const { mergedSchema, report } = merger.merge();

    expect(mergedSchema.properties).toHaveProperty("a");
    expect(mergedSchema.properties).toHaveProperty("b");
    expect(report.warnings).toHaveLength(1);
  });
});