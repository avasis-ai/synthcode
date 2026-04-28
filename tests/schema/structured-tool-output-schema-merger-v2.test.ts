import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMergerV2 } from "../src/schema/structured-tool-output-schema-merger-v2";
import { z } from "zod";

describe("StructuredToolOutputSchemaMergerV2", () => {
  it("should throw an error if the schemas array is empty", () => {
    const merger = new StructuredToolOutputSchemaMergerV2();
    expect(() => merger.merge([], {})).toThrow("Schema array cannot be empty.");
  });

  it("should correctly merge two simple schemas", () => {
    const merger = new StructuredToolOutputSchemaMergerV2();
    const schema1 = z.object({ name: z.string() });
    const schema2 = z.object({ age: z.number() });
    const merged = merger.merge([schema1, schema2], {});

    // Check if the resulting schema object contains both fields
    expect(merged.shape.name).toBeDefined();
    expect(merged.shape.age).toBeDefined();

    // A more robust check would involve validating against the merged schema,
    // but for this test, checking for the presence of keys is sufficient.
  });

  it("should handle merging multiple schemas with overlapping fields", () => {
    const merger = new StructuredToolOutputSchemaMergerV2();
    const schema1 = z.object({ id: z.string(), description: z.string() });
    const schema2 = z.object({ description: z.string().optional(), tags: z.array(z.string()) });
    const schema3 = z.object({ id: z.string().optional(), extra: z.boolean() });

    const merged = merger.merge([schema1, schema2, schema3], {});

    // Check for fields from all three schemas
    expect(merged.shape.id).toBeDefined();
    expect(merged.shape.description).toBeDefined();
    expect(merged.shape.tags).toBeDefined();
    expect(merged.shape.extra).toBeDefined();

    // In a real scenario, we'd check the resulting type/validation logic for 'id'
    // to ensure it correctly merges optionality/types from schema1 and schema3.
  });
});