import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMergerV103 } from "../src/schema/structured-tool-output-schema-merger-v103";
import { z, ZodSchema } from "zod";

describe("StructuredToolOutputSchemaMergerV103", () => {
  const merger = new StructuredToolOutputSchemaMergerV103();

  it("should merge two simple schemas with 'prefer-latest' strategy", () => {
    const schema1 = z.object({
      id: z.string(),
      name: z.string(),
    });
    const schema2 = z.object({
      name: z.string().optional(),
      description: z.string(),
    });

    const mergedSchema = merger.mergeSchemas([schema1, schema2], {
      strategy: "prefer-latest",
    });

    // Check if both fields are present and the structure is correct
    expect(mergedSchema.shape.id).toBeDefined();
    expect(mergedSchema.shape.name).toBeDefined();
    expect(mergedSchema.shape.description).toBeDefined();
  });

  it("should handle conflict resolution with 'fail-on-conflict' strategy", () => {
    const schema1 = z.object({
      fieldA: z.string(),
      fieldB: z.number(),
    });
    const schema2 = z.object({
      fieldB: z.boolean(), // Conflict type
      fieldC: z.string(),
    });

    // We expect the merge to throw an error when using fail-on-conflict due to type conflict on fieldB
    expect(() => {
      merger.mergeSchemas([schema1, schema2], {
        strategy: "fail-on-conflict",
      });
    }).toThrow();
  });

  it("should merge multiple schemas correctly with 'merge-compatible' strategy", () => {
    const schema1 = z.object({
      a: z.string(),
    });
    const schema2 = z.object({
      b: z.number(),
    });
    const schema3 = z.object({
      a: z.string().optional(), // Optional override
      c: z.boolean(),
    });

    const mergedSchema = merger.mergeSchemas([schema1, schema2, schema3], {
      strategy: "merge-compatible",
    });

    // Check if all fields are present
    expect(mergedSchema.shape.a).toBeDefined();
    expect(mergedSchema.shape.b).toBeDefined();
    expect(mergedSchema.shape.c).toBeDefined();
  });
});