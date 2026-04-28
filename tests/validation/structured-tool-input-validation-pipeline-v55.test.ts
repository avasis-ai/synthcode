import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipeline } from "../src/validation/structured-tool-input-validation-pipeline-v55";

describe("StructuredToolInputValidationPipeline", () => {
  it("should return valid result for correctly structured input", () => {
    const pipeline = new StructuredToolInputValidationPipeline();
    const context: ValidationContext = {
      input: { toolName: "search", parameters: { query: "test" } },
      messages: [
        { role: "user", content: [{ type: "text", text: "Search for test" }] }
      ],
      schema: {
        toolName: { type: "string" },
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" }
          },
          required: ["query"]
        }
      }
    };
    const result = pipeline.validate(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid result with errors for missing required parameters", () => {
    const pipeline = new StructuredToolInputValidationPipeline();
    const context: ValidationContext = {
      input: { toolName: "search", parameters: {} },
      messages: [
        { role: "user", content: [{ type: "text", text: "Search for test" }] }
      ],
      schema: {
        toolName: { type: "string" },
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" }
          },
          required: ["query"]
        }
      }
    };
    const result = pipeline.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required parameter: query");
  });

  it("should return invalid result for incorrect data type in input", () => {
    const pipeline = new StructuredToolInputValidationPipeline();
    const context: ValidationContext = {
      input: { toolName: "search", parameters: { query: 123 } },
      messages: [
        { role: "user", content: [{ type: "text", text: "Search for test" }] }
      ],
      schema: {
        toolName: { type: "string" },
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" }
          },
          required: ["query"]
        }
      }
    };
    const result = pipeline.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid type for parameter 'query': expected string, got number");
  });
});