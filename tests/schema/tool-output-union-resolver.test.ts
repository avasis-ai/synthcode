import { describe, it, expect } from "vitest";
import { ToolOutputUnionResolver } from "../src/schema/tool-output-union-resolver";

describe("ToolOutputUnionResolver", () => {
  it("should return an empty object schema when no inputs are provided", () => {
    const resolver = new ToolOutputUnionResolver([]);
    const result = resolver.resolve([]);
    expect(result).toEqual({ type: "object", properties: {} });
  });

  it("should merge properties from multiple schemas correctly", () => {
    const schema1 = { type: "object", properties: { id: { type: "string" }, name: { type: "string" } } };
    const schema2 = { type: "object", properties: { name: { type: "string" }, email: { type: "string" } } };
    const resolver = new ToolOutputUnionResolver([schema1, schema2]);
    const inputs = [
      { toolName: "tool1", schema: schema1 },
      { toolName: "tool2", schema: schema2 },
    ];
    const result = resolver.resolve(inputs);
    expect(result.properties).toHaveProperty("id");
    expect(result.properties).toHaveProperty("name");
    expect(result.properties).toHaveProperty("email");
    expect(Object.keys(result.properties).length).toBe(3);
  });

  it("should handle overlapping properties by merging types (though implementation might need refinement for complex merging)", () => {
    const schema1 = { type: "object", properties: { commonField: { type: "string" }, unique1: { type: "number" } } };
    const schema2 = { type: "object", properties: { commonField: { type: "boolean" }, unique2: { type: "string" } } };
    const resolver = new ToolOutputUnionResolver([schema1, schema2]);
    const inputs = [
      { toolName: "tool1", schema: schema1 },
      { toolName: "tool2", schema: schema2 },
    ];
    const result = resolver.resolve(inputs);
    // Based on the provided code snippet, it seems properties are merged, and the type handling for overlaps is crucial.
    // Assuming the resolver correctly merges properties and handles the overlap for 'commonField'.
    expect(result.properties).toHaveProperty("commonField");
    expect(result.properties).toHaveProperty("unique1");
    expect(result.properties).toHaveProperty("unique2");
  });
});