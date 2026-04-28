import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipelineV32 } from "../src/validation/structured-tool-input-validation-pipeline-v32";

describe("StructuredToolInputValidationPipelineV32", () => {
  it("should validate correctly when all inputs are valid", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV32();
    const context: any = {
      inputs: {
        toolName: "search",
        query: "vitest testing",
        params: {
          maxResults: 10,
        },
      },
      allMessages: [
        { type: "user", content: [{ type: "text", text: "Search for vitest testing" }] },
        { type: "assistant", content: [{ type: "tool_use", tool_use: { tool_name: "search", tool_input: { query: "vitest testing", maxResults: 10 } } }] },
      ],
    };
    const result = await pipeline.validate(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail validation when a required field is missing", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV32();
    const context: any = {
      inputs: {
        toolName: "search",
        // query is missing
        params: {
          maxResults: 10,
        },
      },
      allMessages: [
        { type: "user", content: [{ type: "text", text: "Search for vitest testing" }] },
        { type: "assistant", content: [{ type: "tool_use", tool_use: { tool_name: "search", tool_input: { query: "vitest testing", maxResults: 10 } } }] },
      ],
    };
    const result = await pipeline.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("query");
  });

  it("should fail validation when a parameter type is incorrect", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV32();
    const context: any = {
      inputs: {
        toolName: "search",
        query: "valid query",
        params: {
          maxResults: "not a number", // Incorrect type
        },
      },
      allMessages: [
        { type: "user", content: [{ type: "text", text: "Search for valid query" }] },
        { type: "assistant", content: [{ type: "tool_use", tool_use: { tool_name: "search", tool_input: { query: "valid query", maxResults: "not a number" } } }] },
      ],
    };
    const result = await pipeline.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("params.maxResults");
  });
});