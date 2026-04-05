import { describe, it, expect } from "vitest";
import { ToolOutputSchemaUnionResolverV10, ConflictResolutionStrategy } from "../src/schema/tool-output-schema-union-resolver-v10";

describe("ToolOutputSchemaUnionResolverV10", () => {
  it("should resolve schemas using MERGE strategy correctly", () => {
    const resolver = new ToolOutputSchemaUnionResolverV10();
    const schema1 = { type: "object", properties: { a: { type: "string" } } };
    const schema2 = { type: "object", properties: { b: { type: "number" } } };
    const mergedSchema = resolver.resolve([schema1, schema2], ConflictResolutionStrategy.MERGE);

    expect(mergedSchema).toEqual({
      type: "object",
      properties: {
        a: { type: "string" },
        b: { type: "number" },
      },
    });
  });

  it("should resolve schemas using PREFER_FIRST strategy correctly", () => {
    const resolver = new ToolOutputSchemaUnionResolverV10();
    const schema1 = { type: "object", properties: { a: { type: "string" }, c: { type: "boolean" } } };
    const schema2 = { type: "object", properties: { a: { type: "integer" }, b: { type: "string" } } };
    const resolvedSchema = resolver.resolve([schema1, schema2], ConflictResolutionStrategy.PREFER_FIRST);

    expect(resolvedSchema).toEqual({
      type: "object",
      properties: {
        a: { type: "string" },
        c: { type: "boolean" },
      },
    });
  });

  it("should resolve schemas using PREFER_LATEST strategy correctly", () => {
    const resolver = new ToolOutputSchemaUnionResolverV10();
    const schema1 = { type: "object", properties: { a: { type: "string" }, c: { type: "boolean" } } };
    const schema2 = { type: "object", properties: { a: { type: "integer" }, b: { type: "string" } } };
    const resolvedSchema = resolver.resolve([schema1, schema2], ConflictResolutionStrategy.PREFER_LATEST);

    expect(resolvedSchema).toEqual({
      type: "object",
      properties: {
        a: { type: "integer" },
        b: { type: "string" },
      },
    });
  });
});