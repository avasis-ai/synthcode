import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMerger, ConflictStrategy } from "../src/schema/structured-tool-output-schema-merger-v1001";
import { z } from "zod";

describe("StructuredToolOutputSchemaMerger", () => {
  it("should merge schemas correctly with UNION strategy", () => {
    const merger = new StructuredToolOutputSchemaMerger({
      conflictStrategy: ConflictStrategy.UNION,
    });

    const schemaA = z.object({
      fieldA: z.string(),
      fieldB: z.number(),
    });
    const schemaB = z.object({
      fieldB: z.boolean(),
      fieldC: z.boolean(),
    });

    const mergedSchema = merger.merge(schemaA, schemaB);

    // Basic check to ensure merging happened and structure is preserved
    expect(mergedSchema).toBeDefined();
    // In a real scenario, we'd test the resulting Zod schema structure more deeply.
    // For this example, we just check if it's callable/valid.
    expect(mergedSchema.safeParse({ fieldA: "test", fieldB: 1, fieldC: true })).toMatchObject({ success: true });
  });

  it("should handle conflicts using PREFER_LATEST strategy", () => {
    const merger = new StructuredToolOutputSchemaMerger({
      conflictStrategy: ConflictStrategy.PREFER_LATEST,
    });

    const schemaA = z.object({
      commonField: z.string().optional(),
    });
    const schemaB = z.object({
      commonField: z.number().optional(), // Conflict: string vs number
    });

    const mergedSchema = merger.merge(schemaA, schemaB);

    // When PREFER_LATEST, the second schema (schemaB) should win for conflicts.
    // We check if the resulting schema expects a number for commonField.
    const commonFieldSchema = mergedSchema.shape.commonField;
    expect(commonFieldSchema).toBeDefined();
    // This assertion is highly dependent on Zod's internal representation,
    // but we assert that the type change (string -> number) is reflected.
    // A more robust test would involve inspecting the underlying Zod type.
    expect(commonFieldSchema.constructor.name).toContain("ZodNumber");
  });

  it("should fail fast when conflict strategy is FAIL_FAST", () => {
    const merger = new StructuredToolOutputSchemaMerger({
      conflictStrategy: ConflictStrategy.FAIL_FAST,
    });

    const schemaA = z.object({
      commonField: z.string(),
    });
    const schemaB = z.object({
      commonField: z.number(), // Conflict
    });

    // We expect the merge operation to throw an error when conflict strategy is FAIL_FAST
    expect(() => merger.merge(schemaA, schemaB)).toThrow();
  });
});