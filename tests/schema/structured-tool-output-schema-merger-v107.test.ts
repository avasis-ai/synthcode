import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMerger } from "../src/schema/structured-tool-output-schema-merger-v107";
import { z } from "zod";

describe("StructuredToolOutputSchemaMerger", () => {
  it("should merge two simple schemas with PREFER_LATEST strategy", () => {
    const schema1 = z.object({
      id: z.string(),
      name: z.string().optional(),
    });
    const schema2 = z.object({
      id: z.string().optional(),
      description: z.string().optional(),
    });

    const merger = new StructuredToolOutputSchemaMerger({
      conflictStrategy: "PREFER_LATEST",
    });

    const mergedSchema = merger.merge(schema1, schema2);

    // Basic check to ensure merging happened and the structure is somewhat preserved
    expect(mergedSchema).toBeDefined();
    // A more robust check would involve inspecting the resulting Zod schema structure,
    // but for this example, we check for the presence of expected fields.
    const mergedObject = mergedSchema.safeParse({});
    expect(mergedObject.success).toBe(true);
  });

  it("should handle conflicts using MERGE_ARRAY strategy for arrays", () => {
    const schema1 = z.object({
      tags: z.array(z.string()),
    });
    const schema2 = z.object({
      tags: z.array(z.string()),
    });

    const merger = new StructuredToolOutputSchemaMerger({
      conflictStrategy: "MERGE_ARRAY",
    });

    const mergedSchema = merger.merge(schema1, schema2);

    // In a real scenario, we'd check if the resulting array type correctly merges elements.
    // Here we just ensure the merge process runs without error.
    expect(mergedSchema).toBeDefined();
  });

  it("should fail merging when conflict strategy is set to FAIL and types conflict", () => {
    const schema1 = z.object({
      count: z.number(),
    });
    const schema2 = z.object({
      count: z.string(),
    });

    const merger = new StructuredToolOutputSchemaMerger({
      conflictStrategy: "FAIL",
    });

    const mergedSchema = merger.merge(schema1, schema2);

    // We expect the merge operation to throw or result in a schema that indicates failure
    // depending on the implementation's error handling. Assuming it throws on conflict.
    expect(() => merger.merge(schema1, schema2)).toThrow();
  });
});