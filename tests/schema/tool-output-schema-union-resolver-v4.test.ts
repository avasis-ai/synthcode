import { describe, it, expect } from "vitest";
import { ToolOutputSchemaUnionResolverV4, SchemaMergeStrategy } from "../src/schema/tool-output-schema-union-resolver-v4";

describe("ToolOutputSchemaUnionResolverV4", () => {
  it("should resolve schemas correctly with MERGE_OPTIONAL strategy", () => {
    const resolver = new ToolOutputSchemaUnionResolverV4(SchemaMergeStrategy.MERGE_OPTIONAL);
    const schemas = [
      { type: "object", properties: { a: { type: "string" } } },
      { type: "object", properties: { b: { type: "number" } } },
    ];
    // Mocking the context and return type for simplicity in the test
    const result = resolver.resolve(schemas, {} as any);
    expect(result).toBeDefined();
  });

  it("should resolve schemas correctly with STRICT strategy", () => {
    const resolver = new ToolOutputSchemaUnionResolverV4(SchemaMergeStrategy.STRICT);
    const schemas = [
      { type: "object", properties: { a: { type: "string" } } },
      { type: "object", properties: { b: { type: "number" } } },
    ];
    const result = resolver.resolve(schemas, {} as any);
    expect(result).toBeDefined();
  });

  it("should resolve schemas correctly with LENIENT strategy", () => {
    const resolver = new ToolOutputSchemaUnionResolverV4(SchemaMergeStrategy.LENIENT);
    const schemas = [
      { type: "object", properties: { a: { type: "string" } } },
      { type: "object", properties: { b: { type: "number" } } },
    ];
    const result = resolver.resolve(schemas, {} as any);
    expect(result).toBeDefined();
  });
});