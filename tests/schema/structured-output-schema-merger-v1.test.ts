import { describe, it, expect } from "vitest";
import { SchemaMerger } from "../src/schema/structured-output-schema-merger-v1";
import { z } from "zod";

describe("SchemaMerger", () => {
  it("should merge two simple schemas correctly with 'prefer_latest' strategy", () => {
    const schema1 = z.object({
      id: z.string(),
      name: z.string(),
    });
    const schema2 = z.object({
      name: z.string().optional(),
      email: z.string().email(),
    });

    const merger = new SchemaMerger([schema1, schema2], "prefer_latest");
    const mergedSchema = merger.merge();

    // Check if the resulting schema has the expected structure and types
    expect(mergedSchema.shape.id).toBeDefined();
    expect(mergedSchema.shape.name).toBeDefined();
    expect(mergedSchema.shape.email).toBeDefined();

    // A simple validation test to ensure the merged object structure is valid
    const validData = {
      id: "123",
      name: "Test User",
      email: "test@example.com",
    };
    expect(mergedSchema.safeParse(validData).success).toBe(true);
  });

  it("should handle schema conflicts based on the 'union_all' strategy", () => {
    const schema1 = z.object({
      fieldA: z.string(),
      fieldB: z.number(),
    });
    const schema2 = z.object({
      fieldA: z.string().optional(), // Conflict on fieldA
      fieldC: z.boolean(),
    });

    const merger = new SchemaMerger([schema1, schema2], "union_all");
    const mergedSchema = merger.merge();

    // In 'union_all', fieldA should be able to accept both string and potentially other types if unioned,
    // but for simplicity here, we check for the presence of all fields.
    expect(mergedSchema.shape.fieldA).toBeDefined();
    expect(mergedSchema.shape.fieldB).toBeDefined();
    expect(mergedSchema.shape.fieldC).toBeDefined();

    // Test if the merged schema can accept data conforming to both original fields
    const validData = {
      fieldA: "some value",
      fieldB: 10,
      fieldC: true,
    };
    expect(mergedSchema.safeParse(validData).success).toBe(true);
  });

  it("should report conflicts when merging schemas", () => {
    const schema1 = z.object({
      id: z.string(),
      value: z.number(),
    });
    const schema2 = z.object({
      id: z.string().optional(), // Conflict: Both define 'id'
      value: z.string(), // Conflict: Type mismatch (number vs string)
      newField: z.boolean(),
    });

    const merger = new SchemaMerger([schema1, schema2], "prefer_latest");
    const mergedSchema = merger.merge();
    const report = merger.getReport();

    // Check if conflicts were recorded
    expect(report.conflicts).toHaveProperty("id");
    expect(report.conflicts).toHaveProperty("value");

    // Check if the resulting schema reflects the 'prefer_latest' strategy for the conflict
    // Since schema2 is last, 'id' should be optional if schema2 made it optional.
    // For 'value', it should adopt the type from schema2 (string).
    expect(mergedSchema.shape.value).toEqual(z.string());
  });
});