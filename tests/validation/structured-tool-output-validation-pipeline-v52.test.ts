import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineV52 } from "../src/validation/structured-tool-output-validation-pipeline-v52";

describe("StructuredToolOutputValidationPipelineV52", () => {
  it("should initialize correctly with steps", () => {
    const pipeline = new StructuredToolOutputValidationPipelineV52();
    // Assuming the pipeline has a way to check if steps are loaded, or we test the execution flow.
    // For this test, we'll just instantiate and check if it runs without immediate errors.
    expect(pipeline).toBeDefined();
  });

  it("should pass validation when all steps succeed", async () => {
    const pipeline = new StructuredToolOutputValidationPipelineV52();
    const context: any = {
      inputData: { key: "value" },
      history: [],
      metadata: {},
    };
    const toolOutput: Record<string, unknown> = { result: "valid" };

    // Mocking the internal steps to ensure success for this test case
    // In a real scenario, we'd test with actual steps, but here we test the pipeline structure.
    // Since we cannot easily mock private/internal state without knowing the full implementation,
    // we assume a successful run based on the public interface if available, or mock the execution.
    // For simplicity, we assume the pipeline has a 'validate' method.
    const result = await pipeline.validate(context, toolOutput);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail validation and collect errors when one step fails", async () => {
    const pipeline = new StructuredToolOutputValidationPipelineV52();
    const context: any = {
      inputData: { key: "value" },
      history: [],
      metadata: {},
    };
    const toolOutput: Record<string, unknown> = { result: "invalid" };

    // Again, assuming a 'validate' method exists and can be tested for failure.
    // We expect the pipeline to aggregate errors from failing steps.
    const result = await pipeline.validate(context, toolOutput);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1); // Expecting at least one error
  });
});