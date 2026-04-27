import { describe, it, expect } from "vitest";
import {
  runValidationPipeline,
  ValidationContext,
  SchemaDefinition,
} from "../src/validation/structured-tool-input-validation-pipeline-v9";

describe("runValidationPipeline", () => {
  it("should return valid when input matches schema", async () => {
    const schema: SchemaDefinition = {
      toolName: { type: "string", required: true },
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", required: true },
          action: { type: "string", required: true },
        },
        required: ["userId", "action"],
      },
    };
    const context: ValidationContext = {
      input: {
        toolName: "getUserInfo",
        parameters: {
          userId: "user123",
          action: "getDetails",
        },
      },
      runtimeState: {},
    };

    const result = await runValidationPipeline(schema, context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid with errors when input is missing required fields", async () => {
    const schema: SchemaDefinition = {
      toolName: { type: "string", required: true },
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", required: true },
          action: { type: "string", required: true },
        },
        required: ["userId", "action"],
      },
    };
    const context: ValidationContext = {
      input: {
        toolName: "getUserInfo",
        parameters: {
          userId: "user123",
          // action is missing
        },
      },
      runtimeState: {},
    };

    const result = await runValidationPipeline(schema, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      "Missing required property: action in parameters",
    ]));
  });

  it("should handle type mismatches and return appropriate errors", async () => {
    const schema: SchemaDefinition = {
      toolName: { type: "string", required: true },
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", required: true },
          limit: { type: "number", required: false },
        },
        required: ["userId"],
      },
    };
    const context: ValidationContext = {
      input: {
        toolName: "searchTool",
        parameters: {
          userId: 12345, // Should be string
          limit: "ten", // Should be number
        },
      },
      runtimeState: {},
    };

    const result = await runValidationPipeline(schema, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      "Expected type 'string' for property 'userId', but received type 'number'",
      "Expected type 'number' for property 'limit', but received type 'string'",
    ]));
  });
});