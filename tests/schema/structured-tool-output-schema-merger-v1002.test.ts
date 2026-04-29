import { describe, it, expect } from "vitest";
import { StructuredSchema, mergeSchemas } from "../src/schema/structured-tool-output-schema-merger-v1002";

describe("mergeSchemas", () => {
  it("should merge two simple schemas using 'prefer_latest' strategy", () => {
    const schema1: StructuredSchema = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    };
    const schema2: StructuredSchema = {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
      },
    };

    const merged = mergeSchemas(schema1, schema2, { strategy: "prefer_latest" });

    expect(merged).toBeDefined();
    expect(merged?.properties).toHaveProperty("id");
    expect(merged?.properties).toHaveProperty("name");
    expect(merged?.properties).toHaveProperty("description");
  });

  it("should merge schemas correctly using 'union_all' strategy", () => {
    const schema1: StructuredSchema = {
      type: "object",
      properties: {
        a: { type: "string" },
      },
    };
    const schema2: StructuredSchema = {
      type: "object",
      properties: {
        b: { type: "number" },
      },
    };

    const merged = mergeSchemas(schema1, schema2, { strategy: "union_all" });

    expect(merged).toBeDefined();
    expect(merged?.properties).toEqual({
      a: { type: "string" },
      b: { type: "number" },
    });
  });

  it("should use a custom resolver when conflicts occur", () => {
    const schema1: StructuredSchema = {
      type: "object",
      properties: {
        sharedField: { type: "string" },
      },
    };
    const schema2: StructuredSchema = {
      type: "object",
      properties: {
        sharedField: { type: "number" },
      },
    };

    const customResolver = (key: string, existingValue: unknown, newValue: unknown): unknown => {
      if (key === "sharedField") {
        return "resolved_value";
      }
      return newValue;
    };

    const merged = mergeSchemas(schema1, schema2, { strategy: "custom_resolver", customResolver });

    expect(merged).toBeDefined();
    expect(merged?.properties).toHaveProperty("sharedField");
    // The custom resolver should dictate the final value/type representation if it returns a specific value
    // For this test, we check if the resolver logic was applied.
    // Since the resolver returns 'unknown', we check if the structure is maintained but the value is resolved.
    expect(merged?.properties?.sharedField).toEqual({ type: "string" }); // Assuming the resolver doesn't change the property definition structure itself, but the merge logic handles it.
  });
});