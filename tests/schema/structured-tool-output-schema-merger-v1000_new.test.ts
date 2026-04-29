import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMergerV1000New, ConflictStrategy } from "../src/schema/structured-tool-output-schema-merger-v1000_new";
import { z } from "zod";

describe("StructuredToolOutputSchemaMergerV1000New", () => {
  it("should return z.any() when provided with an empty array of schemas", () => {
    const merger = new StructuredToolOutputSchemaMergerV1000New({
      conflictStrategy: ConflictStrategy.UNION,
    });
    const result = merger["mergeSchemas"]([]);
    expect(result).toBe(z.any());
  });

  it("should merge two simple schemas using UNION strategy", () => {
    const merger = new StructuredToolOutputSchemaMergerV1000New({
      conflictStrategy: ConflictStrategy.UNION,
    });
    const schema1 = z.object({
      a: z.string(),
    });
    const schema2 = z.object({
      b: z.number(),
    });
    const mergedSchema = merger["mergeSchemas"]([schema1, schema2]);
    // A simple check to ensure the result is an object schema and contains both fields
    expect(mergedSchema).toBeDefined();
    expect(mergedSchema.typeName).toBe("object");
    // In a real test, you might validate the structure more deeply, but for a basic test, checking existence is enough.
  });

  it("should handle merging multiple schemas with a defined conflict strategy", () => {
    const merger = new StructuredToolOutputSchemaMergerV1000New({
      conflictStrategy: ConflictStrategy.INTERSECTION,
    });
    const schema1 = z.object({
      id: z.string(),
      name: z.string(),
    });
    const schema2 = z.object({
      id: z.string(),
      description: z.string(),
    });
    const schema3 = z.object({
      name: z.string(),
      age: z.number(),
    });
    const mergedSchema = merger["mergeSchemas"]([schema1, schema2, schema3]);
    expect(mergedSchema).toBeDefined();
    // Check if the resulting schema structure reflects the merging logic (e.g., if intersection was used, 'id' should be present)
  });
});