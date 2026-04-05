import { describe, it, expect } from "vitest";
import { ToolOutputSchemaUnionResolverV5 } from "../src/schema/tool-output-schema-union-resolver-v5";

describe("ToolOutputSchemaUnionResolverV5", () => {
  it("should return an empty object when given no schemas", () => {
    const resolver = new ToolOutputSchemaUnionResolverV5();
    expect(resolver.resolve(null)).toEqual({});
    expect(resolver.resolve([])).toEqual({});
  });

  it("should correctly merge properties from multiple schemas", () => {
    const resolver = new ToolOutputSchemaUnionResolverV5();
    const schema1 = { name: "field1", type: "string" };
    const schema2 = { name: "field2", type: "number" };
    const schema3 = { name: "field3", type: "boolean" };
    const schemas = [schema1, schema2, schema3];
    const result = resolver.resolve(schemas);
    expect(result).toEqual({
      field1: { name: "field1", type: "string" },
      field2: { name: "field2", type: "number" },
      field3: { name: "field3", type: "boolean" },
    });
  });

  it("should handle schemas with overlapping keys by keeping the last one encountered", () => {
    const resolver = new ToolOutputSchemaUnionResolverV5();
    const schema1 = { commonKey: { type: "string", description: "from one" } };
    const schema2 = { commonKey: { type: "number", description: "from two" } };
    const schemas = [schema1, schema2];
    const result = resolver.resolve(schemas);
    expect(result).toEqual({
      commonKey: { type: "number", description: "from two" },
    });
  });
});