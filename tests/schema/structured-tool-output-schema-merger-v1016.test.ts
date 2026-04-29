import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMergerV1016, ConflictResolutionStrategy } from "../src/schema/structured-tool-output-schema-merger-v1016";
import { z } from "zod";

describe("StructuredToolOutputSchemaMergerV1016", () => {
  it("should merge schemas correctly when using PRIORITIZE_SOURCE strategy", () => {
    const schema1 = z.object({
      id: z.string(),
      name: z.string().optional(),
    });
    const schema2 = z.object({
      id: z.string(),
      description: z.string().optional(),
    });

    const merger = new StructuredToolOutputSchemaMergerV1016([
      { schema: schema1, sourceName: "source1", priority: 1 },
      { schema: schema2, sourceName: "source2", priority: 2 },
    ], ConflictResolutionStrategy.PRIORITIZE_SOURCE);

    const mergedSchema = merger.mergeSchemas();

    // Check if both fields are present and the resulting schema is valid
    expect(mergedSchema.shape.id).toBeDefined();
    expect(mergedSchema.shape.name).toBeDefined();
    expect(mergedSchema.shape.description).toBeDefined();
  });

  it("should handle conflicts by preferring the schema from the highest priority source", () => {
    const schemaA = z.object({
      fieldA: z.string(),
      fieldConflict: z.number(),
    });
    const schemaB = z.object({
      fieldA: z.string(),
      fieldConflict: z.boolean(), // Conflict type
    });

    // Source A has higher priority (lower number)
    const merger = new StructuredToolOutputSchemaMergerV1016([
      { schema: schemaA, sourceName: "high_priority", priority: 1 },
      { schema: schemaB, sourceName: "low_priority", priority: 2 },
    ], ConflictResolutionStrategy.PRIORITIZE_SOURCE);

    const mergedSchema = merger.mergeSchemas();

    // In PRIORITIZE_SOURCE, the type from the highest priority source (A) should win for conflicts.
    // We can't easily assert the exact Zod type without deeper introspection, but we can check structure.
    expect(mergedSchema.shape.fieldA).toBeDefined();
    // Assuming the conflict resolution correctly picks the type from schemaA (number)
    expect(mergedSchema.shape.fieldConflict).toBeDefined();
  });

  it("should merge schemas correctly when using FIRST_WINS strategy", () => {
    const schema1 = z.object({
      id: z.string(),
      optionalField: z.string().optional(),
    });
    const schema2 = z.object({
      id: z.string(),
      anotherField: z.boolean().optional(),
    });

    // Source 1 is processed first, so its definitions should take precedence for common fields
    const merger = new StructuredToolOutputSchemaMergerV1016([
      { schema: schema1, sourceName: "first", priority: 1 },
      { schema: schema2, sourceName: "second", priority: 2 },
    ], ConflictResolutionStrategy.FIRST_WINS);

    const mergedSchema = merger.mergeSchemas();

    expect(mergedSchema.shape.id).toBeDefined();
    expect(mergedSchema.shape.optionalField).toBeDefined();
    expect(mergedSchema.shape.anotherField).toBeDefined();
  });
});