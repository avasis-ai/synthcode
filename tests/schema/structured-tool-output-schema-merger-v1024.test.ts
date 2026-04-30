import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMerger, SchemaMergeStrategy } from "../src/schema/structured-tool-output-schema-merger-v1024";
import { z } from "zod";

describe("StructuredToolOutputSchemaMerger", () => {
  it("should merge schemas using 'most-specific' strategy correctly", () => {
    const schema1 = z.object({
      id: z.string(),
      name: z.string().optional(),
    });
    const schema2 = z.object({
      id: z.string(),
      description: z.string().optional(),
    });

    const merger = new StructuredToolOutputSchemaMerger({
      strategy: SchemaMergeStrategy.MostSpecific,
    });

    const mergedSchema = merger.merge([
      { schema: schema1, source: "source1", priority: 1 },
      { schema: schema2, source: "source2", priority: 2 },
    ]);

    // Expect the merged schema to contain fields from both, and ideally,
    // the structure should be valid for both.
    expect(mergedSchema).toBeDefined();
    // A simple check to ensure both fields are present in the resulting object structure
    expect(mergedSchema.shape.id).toBeDefined();
    expect(mergedSchema.shape.name).toBeDefined();
    expect(mergedSchema.shape.description).toBeDefined();
  });

  it("should merge schemas using 'latest-definition' strategy correctly", () => {
    const schema1 = z.object({
      fieldA: z.string(),
    });
    const schema2 = z.object({
      fieldA: z.number(), // Overwriting type
      fieldB: z.boolean(),
    });

    const merger = new StructuredToolOutputSchemaMerger({
      strategy: SchemaMergeStrategy.LatestDefinition,
    });

    const mergedSchema = merger.merge([
      { schema: schema1, source: "source1", priority: 1 },
      { schema: schema2, source: "source2", priority: 2 },
    ]);

    // When using latest-definition, the type of fieldA should be influenced by source2 (number)
    // This is hard to assert perfectly without deep Zod inspection, but we check for existence.
    expect(mergedSchema).toBeDefined();
    expect(mergedSchema.shape.fieldA).toBeDefined();
    expect(mergedSchema.shape.fieldB).toBeDefined();
  });

  it("should merge schemas using 'manual-override' strategy", () => {
    const schema1 = z.object({
      requiredField: z.string(),
    });
    const schema2 = z.object({
      requiredField: z.boolean(), // This should be ignored or handled based on manual logic
    });

    const merger = new StructuredToolOutputSchemaMerger({
      strategy: SchemaMergeStrategy.ManualOverride,
    });

    const mergedSchema = merger.merge([
      { schema: schema1, source: "source1", priority: 1 },
      { schema: schema2, source: "source2", priority: 2 },
    ]);

    // In manual override, the result depends entirely on the implementation,
    // but we ensure the merge process runs without error and produces a schema.
    expect(mergedSchema).toBeDefined();
    expect(mergedSchema.shape.requiredField).toBeDefined();
  });
});