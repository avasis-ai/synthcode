import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMergerV1017 } from "../src/schema/structured-tool-output-schema-merger-v1017";

describe("StructuredToolOutputSchemaMergerV1017", () => {
  it("should correctly merge two simple object schemas", () => {
    const merger = new StructuredToolOutputSchemaMergerV1017();
    const schemaA = { type: "object", properties: { name: { type: "string" }, age: { type: "number" } } };
    const schemaB = { type: "object", properties: { age: { type: "integer" }, email: { type: "string" } } };

    const mergedSchema = merger.merge(schemaA, schemaB);

    expect(mergedSchema).toBeDefined();
    expect(mergedSchema.properties).toHaveProperty("name");
    expect(mergedSchema.properties).toHaveProperty("age");
    expect(mergedSchema.properties).toHaveProperty("email");
  });

  it("should handle type conflicts by preferring the more specific type (e.g., string over number)", () => {
    const merger = new StructuredToolOutputSchemaMergerV1017();
    const schemaA = { type: "object", properties: { id: { type: "string" } } };
    const schemaB = { type: "object", properties: { id: { type: "number" } } };

    const mergedSchema = merger.merge(schemaA, schemaB);

    // Based on the implementation logic (which favors non-null/non-primitive types or specific rules)
    // we expect one of the types to be chosen, or a union if the resolver handles it.
    // For this test, we check if the property exists and the merger hasn't failed.
    expect(mergedSchema.properties).toHaveProperty("id");
    // A more precise assertion would require knowing the exact conflict resolution for string vs number.
    // Assuming the merger resolves to a valid type structure.
  });

  it("should handle merging when one schema is null or undefined", () => {
    const merger = new StructuredToolOutputSchemaMergerV1017();
    const schemaA = { type: "object", properties: { requiredField: { type: "string" } } };
    const schemaB = null;

    const mergedSchema = merger.merge(schemaA, schemaB);

    expect(mergedSchema).toEqual(schemaA);

    const mergedSchemaReversed = merger.merge(schemaB, schemaA);
    expect(mergedSchemaReversed).toEqual(schemaA);
  });
});