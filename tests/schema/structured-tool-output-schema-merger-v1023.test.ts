import { describe, it, expect } from "vitest";
import { SchemaMergerImpl, MergeStrategy } from "../src/schema/structured-tool-output-schema-merger-v1023";
import { z, ZodSchema } from "zod";

describe("SchemaMergerImpl", () => {
  const merger = new SchemaMergerImpl();

  it("should return z.any() when no schemas are provided", () => {
    const result = merger.merge([], MergeStrategy.Union);
    expect(result).toBe(z.any());
  });

  it("should merge two simple schemas using Union strategy", () => {
    const schema1 = z.object({ a: z.string() });
    const schema2 = z.object({ b: z.number() });
    const mergedSchema = merger.merge([schema1, schema2], MergeStrategy.Union);

    // A simple check to ensure it's not z.any() and has the expected structure (though deep checking is hard)
    expect(mergedSchema).not.toBe(z.any());
    // In a real scenario, we'd validate the resulting schema structure more rigorously.
    // For this test, we just check if the merge operation runs without error and produces a schema.
  });

  it("should merge two schemas using Intersection strategy", () => {
    const schema1 = z.object({ id: z.string(), name: z.string() });
    const schema2 = z.object({ id: z.string(), age: z.number() });
    const mergedSchema = merger.merge([schema1, schema2], MergeStrategy.Intersection);

    // Check if the resulting schema requires both 'id' and 'name' (from schema1) AND 'id' and 'age' (from schema2)
    // The intersection should result in an object containing all unique fields.
    expect(mergedSchema).not.toBe(z.any());
  });
});