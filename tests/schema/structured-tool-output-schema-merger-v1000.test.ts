import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMerger } from "../src/schema/structured-tool-output-schema-merger-v1000";
import { z } from "zod";

describe("StructuredToolOutputSchemaMerger", () => {
  it("should merge schemas using 'prefer_latest' strategy correctly", () => {
    const schema1 = z.object({
      a: z.string(),
      b: z.number(),
    });
    const schema2 = z.object({
      b: z.boolean(), // Conflict on 'b'
      c: z.boolean(),
    });

    const merger = new StructuredToolOutputSchemaMerger({
      strategy: "prefer_latest",
    });

    const mergedSchema = merger.merge(schema1, schema2);

    // Check if 'a' from schema1 is present
    expect(mergedSchema.shape.a._def.typeName).toBe("z.ZodString");
    // Check if 'c' from schema2 is present
    expect(mergedSchema.shape.c._def.typeName).toBe("z.ZodBoolean");
    // Check if 'b' uses the definition from schema2 (the latest one)
    expect(mergedSchema.shape.b._def.typeName).toBe("z.ZodBoolean");
  });

  it("should merge schemas using 'union_all' strategy correctly", () => {
    const schema1 = z.object({
      id: z.string(),
    });
    const schema2 = z.object({
      id: z.number(), // Conflict on 'id'
      name: z.string(),
    });

    const merger = new StructuredToolOutputSchemaMerger({
      strategy: "union_all",
    });

    const mergedSchema = merger.merge(schema1, schema2);

    // Check if 'id' is a union of string and number
    const idSchema = mergedSchema.shape.id._def;
    expect(idSchema.typeName).toBe("z.ZodUnion");
    // A simple check to ensure it's a union (more robust checks might require deeper introspection)
    expect(idSchema.unionDiscriminator).toBeDefined();
  });

  it("should handle missing keys gracefully", () => {
    const schema1 = z.object({
      required_field: z.string(),
    });
    const schema2 = z.object({
      optional_field: z.boolean(),
    });

    const merger = new StructuredToolOutputSchemaMerger({
      strategy: "prefer_latest",
    });

    const mergedSchema = merger.merge(schema1, schema2);

    // Check that both fields are present
    expect(mergedSchema.shape.required_field).toBeDefined();
    expect(mergedSchema.shape.optional_field).toBeDefined();
  });
});