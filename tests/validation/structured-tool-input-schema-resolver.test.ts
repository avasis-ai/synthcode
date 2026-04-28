import { describe, it, expect } from "vitest";
import {
  StructuredToolInputSchemaResolver,
  ToolDefinition,
  Context,
  Schema,
} from "../src/validation/structured-tool-input-schema-resolver";

describe("StructuredToolInputSchemaResolver", () => {
  it("should resolve a simple required string parameter schema correctly", async () => {
    const toolDefinition: ToolDefinition = {
      name: "get_weather",
      description: "Get the current weather in a given location",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "City name" },
        },
        required: ["location"],
      },
    };
    const context: Context = {};

    const resolver = new StructuredToolInputSchemaResolver();
    const schema = await resolver.resolveSchema(
      toolDefinition,
      context
    );

    expect(schema).toBeDefined();
    expect(schema?.type).toBe("object");
    expect(schema?.properties).toHaveProperty("location");
    expect(schema?.required).toEqual(["location"]);
  });

  it("should handle tools with optional parameters correctly", async () => {
    const toolDefinition: ToolDefinition = {
      name: "search_database",
      description: "Search the internal database",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "integer", description: "Number of results to return" },
        },
        required: ["query"],
      },
    };
    const context: Context = {};

    const resolver = new StructuredToolInputSchemaResolver();
    const schema = await resolver.resolveSchema(
      toolDefinition,
      context
    );

    expect(schema).toBeDefined();
    expect(schema?.properties).toHaveProperty("query");
    expect(schema?.properties).toHaveProperty("limit");
    expect(schema?.required).toEqual(["query"]);
  });

  it("should return a basic object schema if parameters are empty", async () => {
    const toolDefinition: ToolDefinition = {
      name: "no_params_tool",
      description: "A tool that takes no arguments",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    };
    const context: Context = {};

    const resolver = new StructuredToolInputSchemaResolver();
    const schema = await resolver.resolveSchema(
      toolDefinition,
      context
    );

    expect(schema).toBeDefined();
    expect(schema?.type).toBe("object");
    expect(schema?.properties).toEqual({});
    expect(schema?.required).toEqual([]);
  });
});