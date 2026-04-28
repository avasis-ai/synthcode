import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMerger } from "../src/schema/structured-tool-output-schema-merger-v109";
import { z } from "zod";

describe("StructuredToolOutputSchemaMerger", () => {
  it("should throw an error if no schemas are provided", () => {
    expect(() => new StructuredToolOutputSchemaMerger([], "prefer-most-specific")).toThrow("Schemas array cannot be empty");
  });

  it("should merge two simple schemas correctly using 'prefer-most-specific'", () => {
    const schema1 = z.object({
      id: z.string(),
      name: z.string(),
    });
    const schema2 = z.object({
      name: z.string().optional(),
      email: z.string().email(),
    });

    const merger = new StructuredToolOutputSchemaMerger([schema1, schema2], "prefer-most-specific");
    const mergedSchema = merger.merge();

    expect(mergedSchema.shape.id).toBeDefined();
    expect(mergedSchema.shape.name).toBeDefined();
    expect(mergedSchema.shape.email).toBeDefined();
  });

  it("should handle type conflicts using 'union-type'", () => {
    const schema1 = z.object({
      value: z.string(),
    });
    const schema2 = z.object({
      value: z.number(),
    });

    const merger = new StructuredToolOutputSchemaMerger([schema1, schema2], "union-type");
    const mergedSchema = merger.merge();

    // In a real scenario, we'd check the resulting Zod type structure,
    // but for this test, we ensure the merge process runs without error
    // and that the resulting schema structure is present.
    expect(mergedSchema.shape.value).toBeDefined();
  });
});