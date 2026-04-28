import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipelineV30 } from "../src/validation/structured-tool-input-validation-pipeline-v30";

describe("StructuredToolInputValidationPipelineV30", () => {
  it("should return valid result for correctly structured input", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV30();
    const input = {
      toolName: "search",
      parameters: {
        query: "test query",
        maxResults: 10,
      },
    };
    const result = await pipeline.validate(input, {});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid result with errors for missing required fields", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV30();
    const input = {
      toolName: "search",
      parameters: {
        // query is missing
        maxResults: 5,
      },
    };
    const result = await pipeline.validate(input, {});
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required parameter: query");
  });

  it("should handle context-dependent validation failures", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV30();
    const input = {
      toolName: "getWeather",
      parameters: {
        location: "unknown_city",
      },
    };
    const context = {
      availableLocations: ["London", "Paris"],
    };
    const result = await pipeline.validate(input, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Location 'unknown_city' is not available in context.");
  });
});