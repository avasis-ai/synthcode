import { describe, it, expect } from "vitest";
import { ToolOutputValidationPipeline } from "../src/validation/tool-output-validation-pipeline-v1";

describe("ToolOutputValidationPipeline", () => {
  it("should run successfully with a single valid step", () => {
    const pipeline = new ToolOutputValidationPipeline();
    const mockStep: any = {
      validate: jest.fn((input: any) => ({ isValid: true, result: { processed: input } })),
    };
    pipeline.addStep(mockStep);

    const result = pipeline.run({ data: "test" });

    expect(mockStep.validate).toHaveBeenCalledWith({ data: "test" });
    expect(result.success).toBe(true);
    expect(result.finalResult).toEqual({ processed: { data: "test" } });
    expect(result.errors).toEqual([]);
  });

  it("should stop and report failure if any step fails validation", () => {
    const pipeline = new ToolOutputValidationPipeline();
    const mockStep1: any = {
      validate: jest.fn((input: any) => ({ isValid: true, result: { step1: input } })),
    };
    const mockStep2: any = {
      validate: jest.fn((input: any) => ({ isValid: false, result: null, error: "Invalid data in step 2" })),
    };
    const mockStep3: any = {
      validate: jest.fn((input: any) => ({ isValid: true, result: { step3: input } })),
    };
    pipeline.addStep(mockStep1);
    pipeline.addStep(mockStep2);
    pipeline.addStep(mockStep3);

    const result = pipeline.run({ initial: true });

    expect(mockStep1.validate).toHaveBeenCalledWith({ initial: true });
    expect(mockStep2.validate).toHaveBeenCalledWith({ step1: { initial: true } });
    expect(mockStep3.validate).not.toHaveBeenCalled(); // Should stop at step 2
    expect(result.success).toBe(false);
    expect(result.errors).toContain("Invalid data in step 2");
    expect(result.finalResult).toBeNull();
  });

  it("should pass through the result if all steps are valid", () => {
    const pipeline = new ToolOutputValidationPipeline();
    const mockStep1: any = {
      validate: jest.fn((input: any) => ({ isValid: true, result: { s1: input } })),
    };
    const mockStep2: any = {
      validate: jest.fn((input: any) => ({ isValid: true, result: { s2: input } })),
    };
    pipeline.addStep(mockStep1);
    pipeline.addStep(mockStep2);

    const result = pipeline.run({ initial: "data" });

    expect(mockStep1.validate).toHaveBeenCalledTimes(1);
    expect(mockStep2.validate).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.finalResult).toEqual({ s2: { s1: { initial: "data" } } });
    expect(result.errors).toEqual([]);
  });
});