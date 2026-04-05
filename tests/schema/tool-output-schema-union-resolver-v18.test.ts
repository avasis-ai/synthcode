import { describe, it, expect } from "vitest";
import { ToolOutputSchemaUnionResolverV18 } from "../src/schema/tool-output-schema-union-resolver-v18";

describe("ToolOutputSchemaUnionResolverV18", () => {
  it("should return an empty object when no schemas are provided", () => {
    const resolver = new ToolOutputSchemaUnionResolverV18([]);
    expect(resolver.resolveUnionSchema()).toEqual({});
  });

  it("should correctly merge two simple object schemas", () => {
    const schema1: any = { type: "object", properties: { id: { type: "string" }, name: { type: "string" } } };
    const schema2: any = { type: "object", properties: { age: { type: "integer" }, email: { type: "string" } } };
    const resolver = new ToolOutputSchemaUnionResolverV18([schema1, schema2]);
    const result = resolver.resolveUnionSchema();

    expect(result.type).toBe("object");
    expect(result.properties).toEqual({
      id: { type: "string" },
      name: { type: "string" },
      age: { type: "integer" },
      email: { type: "string" },
    });
  });

  it("should handle merging schemas with overlapping properties by preferring the last one (or merging if appropriate)", () => {
    const schema1: any = { type: "object", properties: { common: { type: "string" }, unique1: { type: "number" } } };
    const schema2: any = { type: "object", properties: { common: { type: "boolean" }, unique2: { type: "string" } } };
    const resolver = new ToolOutputSchemaUnionResolverV18([schema1, schema2]);
    const result = resolver.resolveUnionSchema();

    // In this implementation, properties from later schemas overwrite earlier ones for the same key
    expect(result.properties.common).toEqual({ type: "boolean" });
    expect(result.properties.unique1).toEqual({ type: "number" });
    expect(result.properties.unique2).toEqual({ type: "string" });
  });
});