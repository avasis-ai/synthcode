import { describe, it, expect } from "vitest";
import { ToolOutputSchemaUnionResolverV20 } from "../src/schema/tool-output-schema-union-resolver-v20";

describe("ToolOutputSchemaUnionResolverV20", () => {
  it("should resolve schemas correctly with UNION_MERGE strategy", () => {
    const resolver = new ToolOutputSchemaUnionResolverV20("UNION_MERGE");
    const schemas: Record<string, any[]> = {
      "fieldA": [
        { type: "string", description: "A" },
        { type: "string", description: "B" },
      ],
      "fieldB": [
        { type: "number", description: "C" },
      ],
    };
    const result = resolver.resolve(schemas);
    expect(result.fieldA).toHaveLength(2);
    expect(result.fieldB).toHaveLength(1);
  });

  it("should resolve schemas correctly with STRICT strategy", () => {
    const resolver = new ToolOutputSchemaUnionResolverV20("STRICT");
    const schemas: Record<string, any[]> = {
      "fieldA": [
        { type: "string", description: "A" },
        { type: "string", description: "B" },
      ],
    };
    const result = resolver.resolve(schemas);
    expect(result.fieldA).toHaveLength(2);
  });

  it("should resolve schemas correctly with LATEST_WINS strategy", () => {
    const resolver = new ToolOutputSchemaUnionResolverV20("LATEST_WINS");
    const schemas: Record<string, any[]> = {
      "fieldA": [
        { type: "string", description: "A" },
        { type: "string", description: "B" },
      ],
    };
    const result = resolver.resolve(schemas);
    expect(result.fieldA).toHaveLength(2);
  });
});