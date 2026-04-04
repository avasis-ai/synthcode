import { describe, it, expect } from "vitest";
import { ToolCallValidatorImpl, ToolDefinition } from "../src/tools/tool-call-validator";
import { z } from "zod";

describe("ToolCallValidatorImpl", () => {
  it("should validate a correctly structured tool call", () => {
    const toolDefinition: ToolDefinition = {
      name: "get_weather",
      description: "Get the current weather",
      parameters: {
        location: z.string(),
        unit: z.enum(["celsius", "fahrenheit"]),
      },
    };
    const schema = z.object({
      location: z.string(),
      unit: z.enum(["celsius", "fahrenheit"]),
    });

    const validator = new ToolCallValidatorImpl(toolDefinition, schema);
    const validCall = { location: "London", unit: "celsius" };

    const result = validator.validateCall(validCall);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid for missing required parameters", () => {
    const toolDefinition: ToolDefinition = {
      name: "get_weather",
      description: "Get the current weather",
      parameters: {
        location: z.string(),
        unit: z.enum(["celsius", "fahrenheit"]),
      },
    };
    const schema = z.object({
      location: z.string(),
      unit: z.enum(["celsius", "fahrenheit"]),
    });

    const validator = new ToolCallValidatorImpl(toolDefinition, schema);
    const invalidCall = { location: "Paris" }; // Missing 'unit'

    const result = validator.validateCall(invalidCall);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Required");
  });

  it("should return invalid for incorrect data types", () => {
    const toolDefinition: ToolDefinition = {
      name: "create_user",
      description: "Create a new user",
      parameters: {
        username: z.string(),
        age: z.number().int(),
      },
    };
    const schema = z.object({
      username: z.string(),
      age: z.number().int(),
    });

    const validator = new ToolCallValidatorImpl(toolDefinition, schema);
    const invalidCall = { username: "testuser", age: "twenty" }; // 'age' should be number

    const result = validator.validateCall(invalidCall);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Expected number");
  });
});