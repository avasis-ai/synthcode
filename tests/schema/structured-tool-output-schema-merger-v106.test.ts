import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputSchemaMerger,
  SchemaMergerOptions,
} from "../src/schema/structured-tool-output-schema-merger-v106";
import {z, ZodSchema} from "zod";

describe("StructuredToolOutputSchemaMerger", () => {
  it("should merge two simple schemas correctly with 'prefer_union' strategy", async () => {
    const schema1 = z.object({
      id: z.string(),
      name: z.string(),
    });
    const schema2 = z.object({
      id: z.string().optional(),
      email: z.string().email(),
    });

    const merger = new StructuredToolOutputSchemaMerger({
      strategy: "prefer_union",
    });

    const mergedSchema = await merger.merge(schema1, schema2);

    // Check if the resulting schema has both fields
    expect(mergedSchema.shape.id).toBeDefined();
    expect(mergedSchema.shape.name).toBeDefined();
    expect(mergedSchema.shape.email).toBeDefined();
  });

  it("should handle conflicts by failing when strategy is 'fail_on_conflict'", async () => {
    const schema1 = z.object({
      id: z.string(),
      age: z.number(),
    });
    const schema2 = z.object({
      id: z.string().optional(),
      age: z.boolean(), // Conflict type
    });

    const merger = new StructuredToolOutputSchemaMerger({
      strategy: "fail_on_conflict",
    });

    await expect(merger.merge(schema1, schema2)).rejects.toThrow();
  });

  it("should correctly merge schemas when one field is optional in both", async () => {
    const schema1 = z.object({
      optionalField: z.string().optional(),
    });
    const schema2 = z.object({
      optionalField: z.string().optional().default("default"),
    });

    const merger = new StructuredToolOutputSchemaMerger({
      strategy: "prefer_intersection",
    });

    const mergedSchema = await merger.merge(schema1, schema2);

    // In intersection, the resulting type should accommodate both possibilities,
    // but for simplicity, we check for the presence of the field.
    expect(mergedSchema.shape.optionalField).toBeDefined();
  });
});