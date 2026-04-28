import { describe, it, expect } from "vitest";
import { validateStructuredToolOutput } from "../src/validation/structured-tool-output-schema-validator-v1001";

describe("validateStructuredToolOutputSchemaValidatorV1001", () => {
  it("should return true for a valid object structure matching the schema", () => {
    const schema: any = {
      type: "object",
      properties: {
        toolName: { type: "string" },
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" },
            limit: { type: "number" },
          },
          required: ["query"],
        },
      },
    };
    const data = {
      toolName: "search_tool",
      parameters: {
        query: "test query",
        limit: 10,
      },
    };
    expect(validateStructuredToolOutput(schema, data)).toBe(true);
  });

  it("should return false if a required field in the object is missing", () => {
    const schema: any = {
      type: "object",
      properties: {
        toolName: { type: "string" },
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" },
            limit: { type: "number" },
          },
          required: ["query"],
        },
      },
    };
    const data = {
      toolName: "search_tool",
      parameters: {
        limit: 10,
      },
    };
    expect(validateStructuredToolOutput(schema, data)).toBe(false);
  });

  it("should return false if the data type does not match the schema definition", () => {
    const schema: any = {
      type: "object",
      properties: {
        toolName: { type: "string" },
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" },
            limit: { type: "number" },
          },
          required: ["query"],
        },
      },
    };
    const data = {
      toolName: 123,
      parameters: {
        query: "test query",
        limit: "not a number",
      },
    };
    expect(validateStructuredToolOutput(schema, data)).toBe(false);
  });
});