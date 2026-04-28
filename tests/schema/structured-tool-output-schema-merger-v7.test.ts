import { describe, it, expect } from "vitest";
import { SchemaMerger } from "../src/schema/structured-tool-output-schema-merger-v7";
import { SchemaDefinition, ConflictResolutionStrategy } from "../src/schema/types";

describe("SchemaMerger", () => {
  it("should throw an error if no schemas are provided", () => {
    expect(() => new SchemaMerger([], ConflictResolutionStrategy.OVERWRITE)).toThrow("SchemaMerger requires at least one schema definition.");
  });

  it("should merge multiple schemas correctly using OVERWRITE strategy", () => {
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
        age: { type: "string" }, // Overwrite test
        email: { type: "string" },
      },
    };
    const merger = new SchemaMerger([schema1, schema2], ConflictResolutionStrategy.OVERWRITE);
    const mergedSchema = merger.merge();

    expect(mergedSchema.type).toBe("object");
    expect(mergedSchema.properties).toEqual({
      name: { type: "string" },
      age: { type: "string" }, // Should be overwritten by schema2
      email: { type: "string" },
    });
  });

  it("should merge multiple schemas correctly using MERGE strategy for properties", () => {
    const schema1: SchemaDefinition = {
      type: "object",
      properties: {
        id: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
      },
    };
    const schema2: SchemaDefinition = {
      type: "object",
      properties: {
        id: { type: "string" },
        tags: { type: "array", items: { type: "string" } }, // Should merge items if applicable
        description: { type: "string" },
      },
    };
    const merger = new SchemaMerger([schema1, schema2], ConflictResolutionStrategy.MERGE);
    const mergedSchema = merger.merge();

    expect(mergedSchema.type).toBe("object");
    expect(mergedSchema.properties).toEqual({
      id: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
      description: { type: "string" },
    });
  });
});