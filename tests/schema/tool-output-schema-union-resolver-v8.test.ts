import { describe, it, expect } from "vitest";
import { ToolOutputSchemaUnionResolverV8 } from "../src/schema/tool-output-schema-union-resolver-v8";

describe("ToolOutputSchemaUnionResolverV8", () => {
  it("should correctly resolve a union of simple types", () => {
    const resolver = new ToolOutputSchemaUnionResolverV8([
      { type: "string" },
      { type: "number" },
    ]);
    const result = resolver.resolve({ type: "string", description: "A string" });
    expect(result).toEqual({ type: "string", description: "A string" });
  });

  it("should correctly resolve a union of complex objects", () => {
    const resolver = new ToolOutputSchemaUnionResolverV8([
      { type: "object", properties: { id: { type: "string" } } },
      { type: "array", items: { type: "boolean" } },
    ]);
    const result = resolver.resolve({ type: "object", properties: { id: { type: "string" } } });
    expect(result).toEqual({ type: "object", properties: { id: { type: "string" } } });
  });

  it("should handle cases where no specific type matches", () => {
    const resolver = new ToolOutputSchemaUnionResolverV8([
      { type: "string" },
      { type: "number" },
    ]);
    const result = resolver.resolve({ type: "boolean" });
    expect(result).toBeNull();
  });
});