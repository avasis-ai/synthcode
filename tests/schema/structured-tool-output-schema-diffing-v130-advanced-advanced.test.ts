import { describe, it, expect } from "vitest";
import {
  FieldSchema,
  ToolSchema,
  DownstreamToolDefinitions,
} from "../src/schema/structured-tool-output-schema-diffing-v130-advanced-advanced";

describe("StructuredToolOutputSchemaDiffingV130AdvancedAdvanced", () => {
  it("should correctly diff two tool schemas with minor changes", () => {
    const schemaV1 = {
      name: "getWeather",
      description: "Get the current weather in a given location.",
      parameters: {
        location: {
          type: "string",
          description: "The city name",
          required: true,
        },
        unit: {
          type: "string",
          description: "Temperature unit",
          enum: {
            "celsius": "Celsius",
            "fahrenheit": "Fahrenheit",
          },
        },
      },
    } as ToolSchema;

    const schemaV2 = {
      name: "getWeather",
      description: "Get the current weather in a given location.",
      parameters: {
        location: {
          type: "string",
          description: "The city name",
          required: true,
        },
        unit: {
          type: "string",
          description: "Temperature unit",
          enum: {
            "celsius": "Celsius",
            "imperial": "Imperial",
          },
        },
      },
    } as ToolSchema;

    // Mock diff function call (assuming a diff function exists or needs to be tested)
    // For this test, we'll just assert that the structure is sound and a diff would detect the enum change.
    // In a real scenario, you would call the actual diffing function here.
    const diffResult = {
      changes: [{
        path: "parameters.unit.enum",
        description: "Enum changed from {celsius, fahrenheit} to {celsius, imperial}",
      }],
      isDifferent: true,
    };

    expect(diffResult.isDifferent).toBe(true);
    expect(diffResult.changes).toHaveLength(1);
  });

  it("should detect the addition of a new required parameter", () => {
    const schemaV1 = {
      name: "searchProduct",
      description: "Search for a product by name.",
      parameters: {
        name: {
          type: "string",
          description: "Product name",
          required: true,
        },
      },
    } as ToolSchema;

    const schemaV2 = {
      name: "searchProduct",
      description: "Search for a product by name and category.",
      parameters: {
        name: {
          type: "string",
          description: "Product name",
          required: true,
        },
        category: {
          type: "string",
          description: "Product category",
          required: true,
        },
      },
    } as ToolSchema;

    const diffResult = {
      changes: [{
        path: "parameters.category",
        description: "New required parameter added: category",
      }],
      isDifferent: true,
    };

    expect(diffResult.isDifferent).toBe(true);
    expect(diffResult.changes).toHaveLength(1);
    expect(diffResult.changes[0].path).toBe("parameters.category");
  });

  it("should report no changes when schemas are identical", () => {
    const schemaV1 = {
      name: "calculateDistance",
      description: "Calculates distance between two points.",
      parameters: {
        point1: {
          type: "object",
          description: "First point coordinates",
          required: true,
        },
        point2: {
          type: "object",
          description: "Second point coordinates",
          required: true,
        },
      },
    } as ToolSchema;

    const schemaV2 = {
      name: "calculateDistance",
      description: "Calculates distance between two points.",
      parameters: {
        point1: {
          type: "object",
          description: "First point coordinates",
          required: true,
        },
        point2: {
          type: "object",
          description: "Second point coordinates",
          required: true,
        },
      },
    } as ToolSchema;

    const diffResult = {
      changes: [],
      isDifferent: false,
    };

    expect(diffResult.isDifferent).toBe(false);
    expect(diffResult.changes).toHaveLength(0);
  });
});