import { describe, it, expect } from "vitest";
import { ToolOutputSchemaUnionAggregator } from "../src/schema/tool-output-union-aggregator";

describe("ToolOutputSchemaUnionAggregator", () => {
  it("should return an empty object schema when given no schemas", () => {
    const aggregator = new ToolOutputSchemaUnionAggregator();
    const result = aggregator.aggregate([]);
    expect(result).toEqual({ type: "object", properties: {} });
  });

  it("should correctly aggregate two simple object schemas into a union", () => {
    const aggregator = new ToolOutputSchemaUnionAggregator();
    const schema1: any = { type: "object", properties: { id: { type: "string" } } };
    const schema2: any = { type: "object", properties: { name: { type: "string" } } };
    const result = aggregator.aggregate([schema1, schema2]);
    expect(result).toEqual({
      oneOf: [
        { type: "object", properties: { id: { type: "string" } } },
        { type: "object", properties: { name: { type: "string" } } },
      ],
    });
  });

  it("should handle aggregation with multiple schemas", () => {
    const aggregator = new ToolOutputSchemaUnionAggregator();
    const schema1: any = { type: "object", properties: { a: { type: "number" } } };
    const schema2: any = { type: "object", properties: { b: { type: "boolean" } } };
    const schema3: any = { type: "object", properties: { c: { type: "string" } } };
    const result = aggregator.aggregate([schema1, schema2, schema3]);
    expect(result).toEqual({
      oneOf: [
        { type: "object", properties: { a: { type: "number" } } },
        { type: "object", properties: { b: { type: "boolean" } } },
        { type: "object", properties: { c: { type: "string" } } },
      ],
    });
  });
});