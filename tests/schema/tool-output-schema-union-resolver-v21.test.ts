import { describe, it, expect } from "vitest";
import { ToolOutputSchemaUnionResolverV21 } from "../src/schema/tool-output-schema-union-resolver-v21";

describe("ToolOutputSchemaUnionResolverV21", () => {
  it("should return an empty object when provided with no schemas", () => {
    const resolver = new ToolOutputSchemaUnionResolverV21();
    const result = resolver.resolve([]);
    expect(result).toEqual({});
  });

  it("should correctly merge multiple simple schemas", () => {
    const resolver = new ToolOutputSchemaUnionResolverV21();
    const schema1 = { type: "object", properties: { a: { type: "string" } } };
    const schema2 = { type: "object", properties: { b: { type: "number" } } };
    const result = resolver.resolve([schema1, schema2]);
    expect(result).toEqual({
      type: "object",
      properties: {
        a: { type: "string" },
        b: { type: "number" },
      },
    });
  });

  it("should handle schemas with overlapping properties by merging them", () => {
    const resolver = new ToolOutputSchemaUnionResolverV21();
    const schema1 = { type: "object", properties: { common: { type: "string" }, unique1: { type: "boolean" } } };
    const schema2 = { type: "object", properties: { common: { type: "integer" }, unique2: { type: "array" } } };
    const result = resolver.resolve([schema1, schema2]);
    expect(result).toEqual({
      type: "object",
      properties: {
        common: { type: "integer" },
        unique1: { type: "boolean" },
        unique2: { type: "array" },
      },
    });
  });
});