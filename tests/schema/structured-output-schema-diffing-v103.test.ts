import { describe, it, expect } from "vitest";
import { diffSchemas } from "../src/schema/structured-output-schema-diffing-v103";
import { z } from "zod";

describe("diffSchemas", () => {
  it("should detect added, removed, and changed fields between two schemas", () => {
    const schemaA = z.object({
      id: z.string(),
      name: z.string(),
      optionalField: z.string().optional(),
    });
    const schemaB = z.object({
      id: z.string(),
      description: z.string(),
      name: z.string(),
      newField: z.number(),
    });

    const diff = diffSchemas(schemaA, schemaB, { strategy: "lenient" });

    expect(diff.diff.added).toHaveProperty("description");
    expect(diff.diff.added).toHaveProperty("newField");
    expect(diff.diff.removed).toHaveProperty("optionalField");
    expect(diff.diff.changed).toHaveProperty("name");
  });

  it("should correctly identify changes in field types or required status", () => {
    const schemaA = z.object({
      count: z.number().optional(),
      isActive: z.boolean(),
    });
    const schemaB = z.object({
      count: z.string().optional(),
      isActive: z.boolean().default(true),
    });

    const diff = diffSchemas(schemaA, schemaB, { strategy: "lenient" });

    expect(diff.diff.changed).toHaveProperty("count");
    expect(diff.diff.changed.count.old).toBe(z.number().optional());
    expect(diff.diff.changed.count.new).toBe(z.string().optional());
  });

  it("should return empty diff when schemas are identical", () => {
    const schema = z.object({
      a: z.string(),
      b: z.number(),
    });
    const diff = diffSchemas(schema, schema, { strategy: "strict" });

    expect(diff.diff.added).toEqual({});
    expect(diff.diff.removed).toEqual({});
    expect(diff.diff.changed).toEqual({});
  });
});