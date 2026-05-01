import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMergerAdvanced, ConflictResolutionStrategy } from "../src/schema/structured-tool-output-schema-merger-v1001_advanced";
import { z } from "zod";

describe("StructuredToolOutputSchemaMergerAdvanced", () => {
  it("should correctly merge two simple schemas with no conflicts", () => {
    const schema1 = z.object({
      id: z.string(),
      name: z.string(),
    });
    const schema2 = z.object({
      description: z.string(),
      isActive: z.boolean(),
    });

    const merger = new StructuredToolOutputSchemaMergerAdvanced([schema1, schema2], "LATEST");
    const result = merger.mergeSchemas();

    expect(result.mergedSchema).toBeDefined();
    expect(result.conflictsResolved).toHaveLength(0);

    const mergedObject = result.mergedSchema.parse({});
    expect(mergedObject).toEqual({}); // Check if it's a valid object structure
  });

  it("should resolve conflicts using the specified strategy (LATEST)", () => {
    const schema1 = z.object({
      fieldA: z.string(),
      fieldB: z.number(),
    });
    const schema2 = z.object({
      fieldB: z.boolean(), // Conflict type: fieldB
      fieldC: z.string(),
    });

    const merger = new StructuredToolOutputSchemaMergerAdvanced([schema1, schema2], "LATEST");
    const result = merger.mergeSchemas();

    expect(result.conflictsResolved).toHaveLength(1);
    expect(result.conflictsResolved[0].field).toBe("fieldB");
    expect(result.conflictsResolved[0].strategyUsed).toBe("LATEST");
    // In LATEST, the second schema's type (boolean) should win
    expect(result.mergedSchema.shape.fieldB).toBe(z.boolean());
  });

  it("should resolve conflicts using the MERGE_FIELDS strategy", () => {
    const schema1 = z.object({
      data: z.object({
        key1: z.string(),
        key2: z.number(),
      }),
    });
    const schema2 = z.object({
      data: z.object({
        key2: z.boolean(), // Conflict type: key2 within data
        key3: z.string(),
      }),
    });

    const merger = new StructuredToolOutputSchemaMergerAdvanced([schema1, schema2], "MERGE_FIELDS");
    const result = merger.mergeSchemas();

    expect(result.conflictsResolved).toHaveLength(1);
    expect(result.conflictsResolved[0].field).toBe("data.key2");
    expect(result.conflictsResolved[0].strategyUsed).toBe("MERGE_FIELDS");
    // Merging should result in a union or combined type if possible, or at least reflect the merge attempt
    // For this test, we primarily check the conflict resolution mechanism was triggered.
    expect(result.mergedSchema.shape.data.shape.key2).toBe(z.union([z.number(), z.boolean()]));
  });
});