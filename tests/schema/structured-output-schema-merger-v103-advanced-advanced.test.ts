import { describe, it, expect } from "vitest";
import { StructuredOutputSchemaMerger } from "../src/schema/structured-output-schema-merger-v103-advanced-advanced";
import { z } from "zod";

describe("StructuredOutputSchemaMerger", () => {
  it("should merge schemas correctly using 'union-all' strategy", () => {
    const schema1 = z.object({
      name: z.string(),
      age: z.number(),
    });
    const schema2 = z.object({
      email: z.string().email(),
      isActive: z.boolean(),
    });

    const merger = new StructuredOutputSchemaMerger([schema1, schema2], "union-all");
    const mergedSchema = merger.merge();

    expect(mergedSchema).toBeDefined();
    // Check if all fields from both schemas are present
    expect(mergedSchema.shape.name).toBeDefined();
    expect(mergedSchema.shape.age).toBeDefined();
    expect(mergedSchema.shape.email).toBeDefined();
    expect(mergedSchema.shape.isActive).toBeDefined();

    // Test validation with data matching both schemas
    const validData = {
      name: "Test User",
      age: 30,
      email: "test@example.com",
      isActive: true,
    };
    expect(mergedSchema.safeParse(validData).success).toBe(true);
  });

  it("should handle conflict resolution using 'prefer-latest' strategy", () => {
    const schema1 = z.object({
      id: z.string(),
      value: z.number().int(),
    });
    // Schema 2 overrides 'value' to be a string, and adds 'source'
    const schema2 = z.object({
      value: z.string(),
      source: z.enum(["api", "db"]),
    });

    const merger = new StructuredOutputSchemaMerger([schema1, schema2], "prefer-latest");
    const mergedSchema = merger.merge();

    // 'value' should take the type from the last schema (schema2: string)
    expect(mergedSchema.shape.value).toEqual(z.string());
    expect(mergedSchema.shape.source).toBeDefined();

    // Test validation with data respecting the 'prefer-latest' type for 'value'
    const validData = {
      id: "123",
      value: "some string value",
      source: "api",
    };
    expect(mergedSchema.safeParse(validData).success).toBe(true);
  });

  it("should throw an error if the initial schema array is empty", () => {
    const merger = new StructuredOutputSchemaMerger([], "union-all");
    expect(() => merger.merge()).toThrow("Schema array cannot be empty.");
  });
});