import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMergerV5 } from "../src/schema/structured-tool-output-schema-merger-v5";

describe("StructuredToolOutputSchemaMergerV5", () => {
  it("should merge schemas correctly with default (intersection) strategy", () => {
    const merger = new StructuredToolOutputSchemaMergerV5({});
    const schema1: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    };
    const schema2: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        description: { type: "string" },
      },
    };

    const mergedSchema = merger.merge(schema1, schema2);

    expect(mergedSchema.properties.id).toBeDefined();
    expect(mergedSchema.properties.name).toBeDefined();
    expect(mergedSchema.properties.description).toBeDefined();
    expect(Object.keys(mergedSchema.properties).length).toBe(3);
  });

  it("should merge schemas correctly with 'prefer-union' strategy", () => {
    const merger = new StructuredToolOutputSchemaMergerV5({
      unionStrategy: "prefer-union",
    });
    const schema1: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    };
    const schema2: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        description: { type: "string" },
      },
    };

    const mergedSchema = merger.merge(schema1, schema2);

    expect(mergedSchema.properties.id).toBeDefined();
    expect(mergedSchema.properties.name).toBeDefined();
    expect(mergedSchema.properties.description).toBeDefined();
    expect(Object.keys(mergedSchema.properties).length).toBe(3);
  });

  it("should handle merging when one schema is empty", () => {
    const merger = new StructuredToolOutputSchemaMergerV5({});
    const schema1: any = {
      type: "object",
      properties: {
        fieldA: { type: "string" },
      },
    };
    const schema2: any = {
      type: "object",
      properties: {},
    };

    const mergedSchema = merger.merge(schema1, schema2);

    expect(mergedSchema.properties.fieldA).toBeDefined();
    expect(Object.keys(mergedSchema.properties).length).toBe(1);
  });
});