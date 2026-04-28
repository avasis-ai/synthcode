import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipeline } from "../src/validation/structured-tool-input-validation-pipeline-v11";

describe("StructuredToolInputValidationPipeline", () => {
  it("should initialize correctly with no steps", () => {
    const pipeline = new StructuredToolInputValidationPipeline();
    // Assuming there's a way to check the internal state or behavior,
    // for this test, we'll just check instantiation.
    expect(pipeline).toBeInstanceOf(StructuredToolInputValidationPipeline);
  });

  it("should process input correctly when all steps pass validation", async () => {
    // Mock a simple pipeline with one passing step for testing the flow
    const mockStep: any = {
      execute: async (context: any, input: any) => ({
        isValid: true,
        errors: [],
        validatedInput: { ...input, processed: true },
      }),
    };
    const pipeline = new StructuredToolInputValidationPipeline([mockStep]);

    const context: any = { messages: [] };
    const input: Record<string, unknown> = { toolName: "testTool", param1: "value1" };

    const result = await pipeline.run(context, input);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.validatedInput).toEqual({ toolName: "testTool", param1: "value1", processed: true });
  });

  it("should fail validation and accumulate errors when any step fails", async () => {
    // Mock a pipeline with two steps, one failing and one passing
    const failingStep: any = {
      execute: async (context: any, input: any) => ({
        isValid: false,
        errors: ["Error from step 1"],
        validatedInput: { ...input },
      }),
    };
    const passingStep: any = {
      execute: async (context: any, input: any) => ({
        isValid: true,
        errors: [],
        validatedInput: { ...input, finalCheck: true },
      }),
    };
    const pipeline = new StructuredToolInputValidationPipeline([failingStep, passingStep]);

    const context: any = { messages: [] };
    const input: Record<string, unknown> = { toolName: "testTool", param1: "value1" };

    const result = await pipeline.run(context, input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error from step 1"]);
    // The final validatedInput should reflect the state after the last executed step,
    // but since the first step fails, the overall result should be invalid.
    // We check that the error from the failing step is present.
    expect(result.validatedInput).toEqual({ toolName: "testTool", param1: "value1" });
  });
});