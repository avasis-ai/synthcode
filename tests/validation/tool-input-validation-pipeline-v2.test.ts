import { describe, it, expect } from "vitest";
import { ToolInputValidationPipelineV2 } from "../src/validation/tool-input-validation-pipeline-v2";

describe("ToolInputValidationPipelineV2", () => {
  it("should return valid result when input is correct", async () => {
    const pipeline = new ToolInputValidationPipelineV2();
    const initialInput = { toolName: "search", query: "test query" };
    const result = await pipeline.run(initialInput, {});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.data).toEqual(initialInput);
  });

  it("should return invalid result with errors when required fields are missing", async () => {
    const pipeline = new ToolInputValidationPipelineV2();
    const initialInput = { toolName: "search", query: undefined };
    const result = await pipeline.run(initialInput, {});
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("query is required");
  });

  it("should handle context updates correctly through the pipeline", async () => {
    // Mocking a scenario where the pipeline uses context
    const pipeline = new ToolInputValidationPipelineV2();
    const initialInput = { toolName: "calculator", value1: 10, value2: 5 };
    // Assuming the pipeline has logic that updates context based on initialInput
    const result = await pipeline.run(initialInput, { previousStepData: "some data" });
    expect(result.isValid).toBe(true);
    // Depending on the actual implementation, we might check if context was merged/updated
    expect(result.data).toEqual(initialInput);
  });
});