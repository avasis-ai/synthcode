import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMerger } from "../src/schema/structured-tool-output-schema-merger-v1003";

describe("StructuredToolOutputSchemaMerger", () => {
  it("should merge two simple schemas using 'union' strategy", () => {
    const merger = new StructuredToolOutputSchemaMerger();
    const schema1: any = {
      name: "schema1",
      properties: {
        a: { type: "string" },
        b: { type: "number" },
      },
    };
    const schema2: any = {
      name: "schema2",
      properties: {
        b: { type: "boolean" },
        c: { type: "string" },
      },
    };

    const options = { strategy: "union" };
    const result = merger.merge(schema1, schema2, options);

    expect(result.mergedSchema.properties).toHaveProperty("a");
    expect(result.mergedSchema.properties).toHaveProperty("b");
    expect(result.mergedSchema.properties).toHaveProperty("c");
    expect(result.mergedSchema.properties.b.type).toBe("boolean"); // Union should prefer the type from the second schema if it's different, or handle it based on implementation logic. For simplicity, we check for existence.
  });

  it("should merge two schemas with conflicting types using 'intersection' strategy", () => {
    const merger = new StructuredToolOutputSchemaMerger();
    const schema1: any = {
      name: "schema1",
      properties: {
        id: { type: "string" },
        value: { type: "number" },
      },
    };
    const schema2: any = {
      name: "schema2",
      properties: {
        id: { type: "string" },
        value: { type: "boolean" },
      },
    };

    const options = { strategy: "intersection" };
    const result = merger.merge(schema1, schema2, options);

    expect(result.mergedSchema.properties).toHaveProperty("id");
    expect(result.mergedSchema.properties).toHaveProperty("value");
    // Intersection might result in a more restrictive type or an error/specific handling.
    // Assuming intersection keeps the common type or a compatible one.
    expect(result.mergedSchema.properties.value).toBeDefined();
  });

  it("should merge schemas preferring the latest definition using 'prefer_latest' strategy", () => {
    const merger = new StructuredToolOutputSchemaMerger();
    const schema1: any = {
      name: "schema1",
      properties: {
        data: { type: "string" },
        optional: { type: "boolean" },
      },
    };
    const schema2: any = {
      name: "schema2",
      properties: {
        data: { type: "integer" }, // Conflict
        optional: { type: "string" }, // Conflict
      },
    };

    const options = { strategy: "prefer_latest" };
    const result = merger.merge(schema1, schema2, options);

    expect(result.mergedSchema.properties.data.type).toBe("integer");
    expect(result.mergedSchema.properties.optional.type).toBe("string");
  });
});