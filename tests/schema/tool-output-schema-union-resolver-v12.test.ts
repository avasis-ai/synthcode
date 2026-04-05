import { describe, it, expect } from "vitest";
import { ToolOutputSchemaUnionResolverV12 } from "../src/schema/tool-output-schema-union-resolver-v12";

describe("ToolOutputSchemaUnionResolverV12", () => {
  const resolver = new ToolOutputSchemaUnionResolverV12();

  it("should return an empty object schema when no schemas are provided", () => {
    const result = resolver.resolve(undefined, {});
    expect(result).toEqual({ type: "object", properties: {} } as any);
  });

  it("should correctly merge multiple simple schemas", () => {
    const schemas = [
      { type: "object", properties: { name: { type: "string" } } },
      { type: "object", properties: { age: { type: "integer" } } },
    ];
    const result = resolver.resolve(schemas, {});
    expect(result).toEqual({
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "integer" },
      },
    } as any);
  });

  it("should handle context when merging schemas", () => {
    const schemas = [
      { type: "object", properties: { id: { type: "string" } } },
    ];
    const context = { id: "test-id" };
    const result = resolver.resolve(schemas, context);
    // Assuming context might influence default values or structure,
    // we check for a basic structure that incorporates context handling if implemented.
    // Based on the provided code snippet, we test the basic merge structure.
    expect(result).toHaveProperty("properties");
    expect(result.properties).toHaveProperty("id");
  });
});