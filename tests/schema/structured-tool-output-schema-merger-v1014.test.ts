import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMerger, MergeStrategy } from "../src/schema/structured-tool-output-schema-merger-v1014";
import { z, ZodSchema } from "zod";

describe("StructuredToolOutputSchemaMerger", () => {
  it("should merge schemas correctly with PreferLatest strategy", () => {
    const schema1 = z.object({
      a: z.string(),
      b: z.number(),
    });
    const schema2 = z.object({
      b: z.boolean(),
      c: z.string(),
    });

    const merger = new StructuredToolOutputSchemaMerger({
      strategy: MergeStrategy.PreferLatest,
    });

    const mergedSchema = merger.merge(schema1, schema2);

    // Check if 'a' from schema1 is present
    expect(mergedSchema.shape.a).toBeDefined();
    // Check if 'b' from schema2 (boolean) overwrites 'b' from schema1 (number)
    expect(mergedSchema.shape.b).toEqual(z.boolean());
    // Check if 'c' from schema2 is present
    expect(mergedSchema.shape.c).toBeDefined();
  });

  it("should merge schemas correctly with UnionFields strategy", () => {
    const schema1 = z.object({
      field1: z.string(),
    });
    const schema2 = z.object({
      field1: z.number(),
      field2: z.boolean(),
    });

    const merger = new StructuredToolOutputSchemaMerger({
      strategy: MergeStrategy.UnionFields,
    });

    const mergedSchema = merger.merge(schema1, schema2);

    // With UnionFields, field1 should be a union of string and number
    expect(mergedSchema.shape.field1).toEqual(z.union([z.string(), z.number()]));
    // field2 should be present
    expect(mergedSchema.shape.field2).toBeDefined();
  });

  it("should throw an error when conflict occurs with ErrorOnConflict strategy", () => {
    const schema1 = z.object({
      id: z.string(),
    });
    const schema2 = z.object({
      id: z.number(),
    });

    const merger = new StructuredToolOutputSchemaMerger({
      strategy: MergeStrategy.ErrorOnConflict,
    });

    // Expecting an error because 'id' conflicts and the strategy is ErrorOnConflict
    expect(() => merger.merge(schema1, schema2)).toThrow();
  });
});