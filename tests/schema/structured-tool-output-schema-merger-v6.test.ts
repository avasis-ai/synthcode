import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMergerV6 } from "../src/schema/structured-tool-output-schema-merger-v6";

describe("StructuredToolOutputSchemaMergerV6", () => {
  it("should merge simple schemas correctly with LATEST strategy", () => {
    const merger = new StructuredToolOutputSchemaMergerV6();
    const schema1: Schema = { type: "object", properties: { a: { type: "string" }, b: { type: "number" } } };
    const schema2: Schema = { type: "object", properties: { b: { type: "boolean" }, c: { type: "string" } } };

    const mergedSchema = merger.mergeSchemas([schema1, schema2], "LATEST");

    expect(mergedSchema.type).toBe("object");
    expect(mergedSchema.properties).toBeDefined();
    expect(mergedSchema.properties!["a"]).toEqual({ type: "string" });
    expect(mergedSchema.properties!["b"]).toEqual({ type: "boolean" }); // Should take from schema2 (LATEST)
    expect(mergedSchema.properties!["c"]).toEqual({ type: "string" });
  });

  it("should merge schemas strictly, failing if conflicts exist (STRICT strategy)", () => {
    const merger = new StructuredToolOutputSchemaMergerV6();
    const schema1: Schema = { type: "object", properties: { a: { type: "string" } } };
    const schema2: Schema = { type: "object", properties: { a: { type: "number" } } }; // Conflict on 'a'

    // We expect the merge to throw an error when using STRICT strategy due to conflict
    expect(() => merger.mergeSchemas([schema1, schema2], "STRICT")).toThrow();
  });

  it("should merge schemas using MERGE_FIELDS strategy", () => {
    const merger = new StructuredToolOutputSchemaMergerV6();
    const schema1: Schema = { type: "object", properties: { id: { type: "string" }, name: { type: "string" } } };
    const schema2: Schema = { type: "object", properties: { name: { type: "string" }, email: { type: "string" } } };

    const mergedSchema = merger.mergeSchemas([schema1, schema2], "MERGE_FIELDS");

    expect(mergedSchema.type).toBe("object");
    expect(mergedSchema.properties).toBeDefined();
    // For MERGE_FIELDS, the type of 'name' should be the union or combined representation if the implementation supports it, 
    // but based on the provided structure, we test for successful merging of distinct fields and the handling of overlapping fields.
    // Assuming MERGE_FIELDS handles type merging gracefully for this test case structure.
    expect(mergedSchema.properties!["id"]).toEqual({ type: "string" });
    expect(mergedSchema.properties!["name"]).toEqual({ type: "string" }); // Should retain a merged/compatible type
    expect(mergedSchema.properties!["email"]).toEqual({ type: "string" });
  });
});