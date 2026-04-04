import { describe, it, expect } from "vitest";
import { ToolOutputSchemaAggregator } from "../src/schema/tool-output-schema-aggregator";

describe("ToolOutputSchemaAggregator", () => {
  it("should correctly merge schemas from multiple tools", () => {
    const schema1: Record<string, any> = {
      id: "string",
      name: "string",
    };
    const schema2: Record<string, any> = {
      description: "string",
      count: "integer",
    };
    const inputs: { toolName: string; schema: Record<string, any> }[] = [
      { toolName: "tool1", schema: schema1 },
      { toolName: "tool2", schema: schema2 },
    ];

    const aggregator = new ToolOutputSchemaAggregator(inputs);
    const mergedSchema = aggregator["getMergedSchema"]();

    expect(mergedSchema).toEqual({
      id: "string",
      name: "string",
      description: "string",
      count: "integer",
    });
  });

  it("should handle an empty list of inputs", () => {
    const inputs: { toolName: string; schema: Record<string, any> }[] = [];
    const aggregator = new ToolOutputSchemaAggregator(inputs);
    const mergedSchema = aggregator["getMergedSchema"]();

    expect(mergedSchema).toEqual({});
  });

  it("should prioritize properties from later schemas if keys conflict", () => {
    const schema1: Record<string, any> = {
      commonField: "string",
      uniqueField1: "boolean",
    };
    const schema2: Record<string, any> = {
      commonField: "number",
      uniqueField2: "string",
    };
    const inputs: { toolName: string; schema: Record<string, any> }[] = [
      { toolName: "toolA", schema: schema1 },
      { toolName: "toolB", schema: schema2 },
    ];

    const aggregator = new ToolOutputSchemaAggregator(inputs);
    const mergedSchema = aggregator["getMergedSchema"]();

    expect(mergedSchema).toEqual({
      commonField: "number",
      uniqueField1: "boolean",
      uniqueField2: "string",
    });
  });
});