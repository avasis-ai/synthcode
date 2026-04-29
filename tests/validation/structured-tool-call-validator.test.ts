import { describe, it, expect } from "vitest";
import { ToolCallValidator } from "../src/validation/structured-tool-call-validator";
import { ToolRegistry } from "../src/validation/tool-call-types";

describe("ToolCallValidator", () => {
  it("should return valid result for a correctly structured tool call", () => {
    const mockToolRegistry: ToolRegistry = {
      getTool: (name: string) => {
        if (name === "get_weather") {
          return {
            name: "get_weather",
            description: "Get the current weather",
            parameters: {
              type: "object",
              properties: {
                location: { type: "string" },
                unit: { type: "string", enum: ["celsius", "fahrenheit"] },
              },
              required: ["location"],
            },
          };
        }
        return undefined;
      },
    };

    const validToolCall: any = {
      name: "get_weather",
      args: {
        location: "New York",
        unit: "celsius",
      },
    };

    const validator = new ToolCallValidator(mockToolRegistry);
    const result = validator.validate(validToolCall);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return errors for an unknown tool name", () => {
    const mockToolRegistry: ToolRegistry = {
      getTool: (name: string) => {
        if (name === "get_weather") {
          return {
            name: "get_weather",
            description: "Get the current weather",
            parameters: {
              type: "object",
              properties: {
                location: { type: "string" },
                unit: { type: "string", enum: ["celsius", "fahrenheit"] },
              },
              required: ["location"],
            },
          };
        }
        return undefined;
      },
    };

    const invalidToolCall: any = {
      name: "non_existent_tool",
      args: {
        location: "London",
      },
    };

    const validator = new ToolCallValidator(mockToolRegistry);
    const result = validator.validate(invalidToolCall);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("name");
    expect(result.errors[0].message).toContain("Tool 'non_existent_tool' not found");
  });

  it("should return errors for missing required arguments", () => {
    const mockToolRegistry: ToolRegistry = {
      getTool: (name: string) => {
        if (name === "get_weather") {
          return {
            name: "get_weather",
            description: "Get the current weather",
            parameters: {
              type: "object",
              properties: {
                location: { type: "string" },
                unit: { type: "string", enum: ["celsius", "fahrenheit"] },
              },
              required: ["location"],
            },
          };
        }
        return undefined;
      },
    };

    const invalidToolCall: any = {
      name: "get_weather",
      args: {
        // Missing 'location' which is required
        unit: "celsius",
      },
    };

    const validator = new ToolCallValidator(mockToolRegistry);
    const result = validator.validate(invalidToolCall);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("args.location");
    expect(result.errors[0].message).toContain("is required");
  });
});