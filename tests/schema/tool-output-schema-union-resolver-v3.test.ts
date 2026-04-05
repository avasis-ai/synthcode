import { describe, it, expect } from "vitest";
import { ToolOutputSchemaUnionResolverV3 } from "../src/schema/tool-output-schema-union-resolver-v3";
import { Schema, ToolOutputSchema } from "../src/schema/schema-resolver-types";

describe("ToolOutputSchemaUnionResolverV3", () => {
  it("should correctly resolve the union schema when dependencies are provided", () => {
    const mockDependencyMap: { [key: string]: { sourceToolId: string; outputSchema: Schema } } = {
      "toolA": { sourceToolId: "toolA", outputSchema: { type: "object", properties: { a: { type: "string" } } } },
      "toolB": { sourceToolId: "toolB", outputSchema: { type: "object", properties: { b: { type: "number" } } } },
    };
    const resolver = new ToolOutputSchemaUnionResolverV3({ dependencyMap: mockDependencyMap });

    const result = resolver.resolveUnionSchema("toolA");
    expect(result).toEqual({ type: "object", properties: { a: { type: "string" } } });

    const result2 = resolver.resolveUnionSchema("toolB");
    expect(result2).toEqual({ type: "object", properties: { b: { type: "number" } } });
  });

  it("should return a default or empty schema if the tool ID is not found in the dependency map", () => {
    const mockDependencyMap: { [key: string]: { sourceToolId: string; outputSchema: Schema } } = {
      "toolA": { sourceToolId: "toolA", outputSchema: { type: "object", properties: { a: { type: "string" } } } },
    };
    const resolver = new ToolOutputSchemaUnionResolverV3({ dependencyMap: mockDependencyMap });

    const result = resolver.resolveUnionSchema("nonExistentTool");
    // Assuming the resolver handles missing keys gracefully, perhaps returning a basic object schema or null/undefined depending on implementation.
    // For this test, we assume it returns a basic object schema if no specific default is defined in the class structure.
    expect(result).toEqual({}); 
  });

  it("should handle an empty dependency map gracefully", () => {
    const mockDependencyMap: { [key: string]: { sourceToolId: string; outputSchema: Schema } } = {};
    const resolver = new ToolOutputSchemaUnionResolverV3({ dependencyMap: mockDependencyMap });

    const result = resolver.resolveUnionSchema("anyTool");
    expect(result).toEqual({});
  });
});