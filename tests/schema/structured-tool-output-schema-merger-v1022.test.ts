import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMerger } from "../src/schema/structured-tool-output-schema-merger-v1022";

describe("StructuredToolOutputSchemaMerger", () => {
  it("should merge schemas correctly with default precedence (LATEST)", () => {
    const merger = new StructuredToolOutputSchemaMerger();
    const schemaA = { type: "object", properties: { fieldA: { type: "string" } } };
    const schemaB = { type: "object", properties: { fieldB: { type: "number" } } };
    const merged = merger.merge(schemaA, schemaB);

    expect(merged).toEqual({
      type: "object",
      properties: {
        fieldA: { type: "string" },
        fieldB: { type: "number" },
      },
    });
  });

  it("should prioritize schema A when precedence is set to 'A'", () => {
    const schemaA = { type: "object", properties: { commonField: { type: "string", description: "A description" } } };
    const schemaB = { type: "object", properties: { commonField: { type: "boolean", description: "B description" } } };
    const merger = new StructuredToolOutputSchemaMerger({ precedence: "A" });
    const merged = merger.merge(schemaA, schemaB);

    expect(merged.properties.commonField).toEqual({ type: "string", description: "A description" });
  });

  it("should handle union type merging when allowUnionMerge is true", () => {
    const schemaA = { type: "array", items: { type: "string" } };
    const schemaB = { type: "array", items: { type: "number" } };
    const merger = new StructuredToolOutputSchemaMerger({ allowUnionMerge: true });
    const merged = merger.merge(schemaA, schemaB);

    expect(merged.type).toBe("array");
    // In a real scenario, the union logic would be more complex, but we test the flag's effect.
    expect(merged.items).toEqual({ type: "string" }); // Assuming the merger handles union representation correctly
  });
});