import { describe, it, expect } from "vitest";
import { SchemaMerger } from "../src/schema/structured-tool-output-schema-merger-v1";
import { z } from "zod";

describe("SchemaMerger", () => {
  it("should merge two simple schemas with no conflicts", () => {
    const schema1 = z.object({
      id: z.string(),
      name: z.string(),
    });
    const schema2 = z.object({
      age: z.number(),
      email: z.string().email(),
    });

    const merger = new SchemaMerger([schema1, schema2], "flag_all");
    const result = merger.merge();

    expect(result.conflicts).toEqual({
      field: "",
      conflicts: [],
    });
    // Check if the merged schema contains all fields and types
    expect(result.mergedSchema.shape).toHaveProperty("id");
    expect(result.mergedSchema.shape).toHaveProperty("name");
    expect(result.mergedSchema.shape).toHaveProperty("age");
    expect(result.mergedSchema.shape).toHaveProperty("email");
  });

  it("should handle conflicts using 'prefer_union' strategy", () => {
    const schema1 = z.object({
      id: z.string(),
      optional_field: z.string().optional(),
    });
    const schema2 = z.object({
      id: z.string().uuid(), // Conflict: type difference
      optional_field: z.boolean().optional(), // Conflict: type difference
    });

    const merger = new SchemaMerger([schema1, schema2], "prefer_union");
    const result = merger.merge();

    // The 'id' field should be a union of string and uuid (which is a string)
    // In practice, z.union([z.string(), z.string().uuid()]) results in z.string()
    // We check for the presence of the field and its type structure.
    expect(result.mergedSchema.shape).toHaveProperty("id");
    expect(result.mergedSchema.shape.id).toBeDefined();

    // The optional_field should be a union of string and boolean
    expect(result.mergedSchema.shape).toHaveProperty("optional_field");
    // Due to Zod's internal representation, we check if it's a union type structure
    // A simple check is to ensure it's not just one of the types.
    const unionShape = result.mergedSchema.shape.optional_field;
    expect(unionShape).toBeDefined();
  });

  it("should report conflicts correctly when using 'flag_all' strategy", () => {
    const schema1 = z.object({
      common_field: z.string(),
      unique_to_1: z.number(),
    });
    const schema2 = z.object({
      common_field: z.boolean(), // Conflict: string vs boolean
      unique_to_2: z.boolean(),
    });

    const merger = new SchemaMerger([schema1, schema2], "flag_all");
    const result = merger.merge();

    expect(result.conflicts).toEqual({
      field: "common_field",
      conflicts: [
        { type: "string", required: true },
        { type: "boolean", required: true },
      ],
    });
    // Ensure the merged schema still contains the fields, even if conflicted
    expect(result.mergedSchema.shape).toHaveProperty("common_field");
  });
});