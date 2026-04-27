import { describe, it, expect } from "vitest";
import { structuredToolInputValidationPipelineV3 } from "../src/validation/structured-tool-input-validation-pipeline-v3";

describe("structuredToolInputValidationPipelineV3", () => {
  it("should return valid context when all inputs are correct", async () => {
    const context: any = {
      messages: [
        { role: "user", content: "What is the capital of France?" },
        { role: "assistant", content: "Paris." },
      ],
      toolName: "get_city_info",
      toolInput: { country: "France", query: "capital" },
    };

    const result = await structuredToolInputValidationPipelineV3(context);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.context).toBeDefined();
  });

  it("should identify missing required fields in toolInput", async () => {
    const context: any = {
      messages: [
        { role: "user", content: "What is the capital of France?" },
      ],
      toolName: "get_city_info",
      toolInput: { country: "France" }, // Missing 'query'
    };

    const result = await structuredToolInputValidationPipelineV3(context);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("query");
  });

  it("should handle invalid data types in toolInput", async () => {
    const context: any = {
      messages: [
        { role: "user", content: "Get info for the US." },
      ],
      toolName: "get_city_info",
      toolInput: { country: "USA", query: 12345 }, // 'query' should be a string
    };

    const result = await structuredToolInputValidationPipelineV3(context);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("query");
    expect(result.errors[0].message).toContain("Expected string");
  });
});