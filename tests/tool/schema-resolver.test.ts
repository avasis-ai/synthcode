import { describe, it, expect } from "vitest";
import { SchemaResolver } from "../src/tool/schema-resolver";

describe("SchemaResolver", () => {
  it("should resolve the schema from the highest priority source", () => {
    const sources = [
      { schema: { name: "low_priority_tool", properties: { a: "string" } }, priority: 1, sourceName: "low" },
      { schema: { name: "high_priority_tool", properties: { b: "number" } }, priority: 2, sourceName: "high" },
    ];
    const resolver = new SchemaResolver(sources);
    const resolved = resolver.resolveSchema();

    expect(resolved.isValid).toBe(true);
    expect(resolved.schema.name).toBe("high_priority_tool");
    expect(resolved.schema.properties).toEqual({ b: "number" });
  });

  it("should return an invalid schema if no sources are provided", () => {
    const sources: any[] = [];
    const resolver = new SchemaResolver(sources);
    const resolved = resolver.resolveSchema();

    expect(resolved.isValid).toBe(false);
    expect(resolved.schema).toEqual({});
  });

  it("should handle merging schemas correctly when multiple sources are present", () => {
    const sources = [
      { schema: { name: "base_tool", properties: { a: "string", b: "number" } }, priority: 1, sourceName: "base" },
      { schema: { name: "override_tool", properties: { b: "boolean", c: "string" } }, priority: 2, sourceName: "override" },
    ];
    const resolver = new SchemaResolver(sources);
    const resolved = resolver.resolveSchema();

    expect(resolved.isValid).toBe(true);
    expect(resolved.schema.name).toBe("override_tool");
    expect(resolved.schema.properties).toEqual({ a: "string", b: "boolean", c: "string" });
  });
});