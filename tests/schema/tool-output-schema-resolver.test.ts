import { describe, it, expect } from "vitest";
import { ToolOutputSchemaResolver } from "../src/schema/tool-output-schema-resolver";

describe("ToolOutputSchemaResolver", () => {
  it("should resolve a single schema correctly", () => {
    const resolver = new ToolOutputSchemaResolver();
    const partialSchemas = [
      { type: "object", properties: { id: { type: "string" } } }
    ];
    const context: any = {};
    const { unifiedSchema, resolutionMap } = resolver.resolve(partialSchemas, context);

    expect(unifiedSchema).toEqual({
      type: "object",
      properties: { id: { type: "string" } },
    });
    expect(resolutionMap).toEqual({});
  });

  it("should merge multiple compatible schemas", () => {
    const resolver = new ToolOutputSchemaResolver();
    const partialSchemas = [
      { type: "object", properties: { name: { type: "string" } } },
      { type: "object", properties: { description: { type: "string" } } }
    ];
    const context: any = {};
    const { unifiedSchema, resolutionMap } = resolver.resolve(partialSchemas, context);

    expect(unifiedSchema).toEqual({
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
      },
    });
    expect(resolutionMap).toEqual({});
  });

  it("should handle an empty list of schemas", () => {
    const resolver = new ToolOutputSchemaResolver();
    const partialSchemas: any[] = [];
    const context: any = {};
    const { unifiedSchema, resolutionMap } = resolver.resolve(partialSchemas, context);

    expect(unifiedSchema).toEqual({});
    expect(resolutionMap).toEqual({});
  });
});