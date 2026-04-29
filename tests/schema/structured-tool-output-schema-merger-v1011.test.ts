import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMerger } from "../src/schema/structured-tool-output-schema-merger-v1011";

describe("StructuredToolOutputSchemaMerger", () => {
  it("should throw an error if no schemas are provided", () => {
    expect(() => new StructuredToolOutputSchemaMerger([], "latest_wins")).toThrow();
  });

  it("should merge schemas correctly using 'latest_wins' strategy", () => {
    const schema1: any = { properties: { a: { type: "string" } } };
    const schema2: any = { properties: { b: { type: "number" }, a: { type: "boolean" } } };
    const merger = new StructuredToolOutputSchemaMerger([schema1, schema2], "latest_wins");
    const mergedSchema = merger.merge();

    expect(mergedSchema.properties.a.type).toBe("boolean");
    expect(mergedSchema.properties.b.type).toBe("number");
  });

  it("should merge schemas correctly using 'union_with_defaults' strategy", () => {
    const schema1: any = { properties: { a: { type: "string", default: "default1" } } };
    const schema2: any = { properties: { b: { type: "integer", default: 10 }, a: { type: "string", default: "default2" } } };
    const merger = new StructuredToolOutputSchemaMerger([schema1, schema2], "union_with_defaults");
    const mergedSchema = merger.merge();

    expect(mergedSchema.properties.a.default).toBe("default2");
    expect(mergedSchema.properties.b.default).toBe(10);
  });
});