import { describe, it, expect } from "vitest";
import { SchemaMergerBuilder } from "../src/schema/structured-tool-output-schema-merger-v1000_advanced-advanced";
import { z } from "zod";

describe("SchemaMergerBuilder", () => {
  it("should merge two simple schemas using 'latest' strategy by default", () => {
    const schema1 = z.object({ a: z.string(), b: z.number() });
    const schema2 = z.object({ b: z.boolean(), c: z.string() });

    const merger = new SchemaMergerBuilder()
      .withSchema(schema1)
      .withSchema(schema2);

    const mergedSchema = merger.build();

    // Check if 'a' from schema1 is present
    expect(mergedSchema.shape.a).toBeDefined();
    // Check if 'c' from schema2 is present
    expect(mergedSchema.shape.c).toBeDefined();
    // Check if 'b' from schema2 (boolean) overwrites 'b' from schema1 (number) due to 'latest' strategy
    expect(mergedSchema.shape.b).toEqual(z.boolean());
  });

  it("should merge schemas correctly using 'union' strategy for conflicts", () => {
    const schema1 = z.object({ id: z.string(), data: z.string() });
    const schema2 = z.object({ id: z.string(), data: z.number() });

    const merger = new SchemaMergerBuilder()
      .withSchema(schema1)
      .withSchema(schema2)
      .withOptions({ strategy: "union" });

    const mergedSchema = merger.build();

    // When using union, the resulting type for 'data' should allow both string and number
    // In Zod, this is typically represented by z.union([z.string(), z.number()])
    expect(mergedSchema.shape.data).toEqual(z.union([z.string(), z.number()]));
  });

  it("should apply custom conflict rules when building the schema", () => {
    const schema1 = z.object({ name: z.string(), value: z.number() });
    const schema2 = z.object({ name: z.string(), value: z.boolean() });

    const merger = new SchemaMergerBuilder()
      .withSchema(schema1)
      .withSchema(schema2)
      .withOptions({
        strategy: "manual",
        conflictRules: {
          value: "type_override_to_string", // Custom rule to force 'value' to string
        },
      });

    const mergedSchema = merger.build();

    // Verify that the custom rule for 'value' was applied, overriding the default merge behavior
    // We check if the resulting schema for 'value' is a string, as per the mock rule application
    expect(mergedSchema.shape.value).toEqual(z.string());
  });
});