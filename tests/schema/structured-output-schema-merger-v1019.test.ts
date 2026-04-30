import { describe, it, expect } from "vitest";
import { StructuredOutputSchemaMerger } from "../src/schema/structured-output-schema-merger-v1019";
import { z } from "zod";

describe("StructuredOutputSchemaMerger", () => {
  it("should merge two simple string schemas correctly using prefer-latest", () => {
    const schema1: z.ZodTypeAny = z.string().optional();
    const schema2: z.ZodTypeAny = z.string().email().optional();

    const merger = new StructuredOutputSchemaMerger([
      { name: "field1", schema: schema1 },
      { name: "field2", schema: schema2 },
    ]);

    const mergedSchema = merger.merge("prefer-latest");

    // Check if the resulting schema for field2 is an email string
    expect(mergedSchema.shape.field2).toBeDefined();
    // A simple check to ensure the type is preserved (though deep checking Zod is hard)
    expect(mergedSchema.shape.field2).toEqual(expect.objectContaining({ _def: { shape: { field2: z.z.string().email().optional() } } }));
  });

  it("should merge two schemas with the same field using union-all strategy", () => {
    const schema1: z.ZodTypeAny = z.number().int();
    const schema2: z.ZodTypeAny = z.string().uuid();

    const merger = new StructuredOutputSchemaMerger([
      { name: "id", schema: schema1 },
      { name: "id", schema: schema2 },
    ]);

    const mergedSchema = merger.merge("union-all");

    // Check if the resulting schema for 'id' is a union of number and string
    expect(mergedSchema.shape.id).toBeDefined();
    // We check if the resulting schema is a union type
    const idSchema = mergedSchema.shape.id;
    expect(idSchema).toEqual(expect.objectContaining({ _def: { union: [z.number().int(), z.string().uuid()] } }));
  });

  it("should merge schemas using strict-intersection strategy when fields conflict", () => {
    const schema1: z.ZodTypeAny = z.object({
      a: z.string(),
      b: z.number(),
    });
    const schema2: z.ZodTypeAny = z.object({
      a: z.boolean(),
      c: z.string(),
    });

    const merger = new StructuredOutputSchemaMerger([
      { name: "root", schema: schema1 },
      { name: "root", schema: schema2 },
    ]);

    const mergedSchema = merger.merge("strict-intersection");

    // Check if the resulting schema for 'a' is an intersection (which Zod often handles by narrowing types or requiring both)
    expect(mergedSchema.shape.a).toBeDefined();
    // For intersection, the resulting type should satisfy both constraints (e.g., string AND boolean, which is impossible, so it might default to a stricter type or fail validation if not handled perfectly)
    // For this test, we primarily check that the structure exists and that 'b' and 'c' are present.
    expect(mergedSchema.shape.b).toEqual(expect.objectContaining({ _def: { zodType: z.number() } }));
    expect(mergedSchema.shape.c).toEqual(expect.objectContaining({ _def: { zodType: z.string() } }));
  });
});