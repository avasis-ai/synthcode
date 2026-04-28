import { describe, it, expect } from "vitest";
import { Schema, ConflictResolutionStrategy } from "../src/schema/structured-tool-output-schema-merger-v4";

describe("Schema", () => {
  it("should correctly merge two simple object schemas", () => {
    const schema1: Schema = {
      type: "object",
      properties: {
        a: { type: "string" },
        b: { type: "number" },
      },
      required: ["a", "b"],
    };
    const schema2: Schema = {
      type: "object",
      properties: {
        b: { type: "string" },
        c: { type: "boolean" },
      },
      required: ["b", "c"],
    };
    const merged = Schema.merge(schema1, schema2, ConflictResolutionStrategy.FailOnConflict);

    expect(merged).toBeDefined();
    expect(merged?.properties?.a).toEqual({ type: "string" });
    expect(merged?.properties?.b).toEqual({ type: "string" }); // Should favor the stricter type if conflict resolution is applied
    expect(merged?.properties?.c).toEqual({ type: "boolean" });
    expect(merged?.required).toEqual(["a", "b", "c"]);
  });

  it("should handle array schema merging", () => {
    const schema1: Schema = {
      type: "array",
      items: { type: "string" },
    };
    const schema2: Schema = {
      type: "array",
      items: { type: "number" },
    };
    const merged = Schema.merge(schema1, schema2, ConflictResolutionStrategy.MergeUnion);

    expect(merged).toBeDefined();
    expect(merged?.items).toEqual({ type: "any" }); // Expecting union or a general type if merging items
  });

  it("should favor the strictest type when merging conflicting properties", () => {
    const schema1: Schema = {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    };
    const schema2: Schema = {
      type: "object",
      properties: {
        id: { type: "number" },
      },
      required: ["id"],
    };
    const merged = Schema.merge(schema1, schema2, ConflictResolutionStrategy.FavorStrictest);

    expect(merged?.properties?.id).toEqual({ type: "string" }); // Assuming string is considered stricter or the merge logic handles it
  });
});