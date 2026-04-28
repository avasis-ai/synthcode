import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipelineV34 } from "../src/validation/structured-tool-input-validation-pipeline-v34";

describe("StructuredToolInputValidationPipelineV34", () => {
  it("should run all validation steps sequentially and aggregate results", async () => {
    const mockStep1: any = {
      execute: (context: any, input: any) => ({
        isValid: true,
        errors: [],
        context: { ...context, step1Context: "ok" },
      }),
    };
    const mockStep2: any = {
      execute: (context: any, input: any) => ({
        isValid: false,
        errors: ["Step 2 failed validation"],
        context: { ...context, step2Context: "failed" },
      }),
    };
    const pipeline = new StructuredToolInputValidationPipelineV34([mockStep1, mockStep2]);

    const result = await pipeline.run({}, { toolInput: "test" });

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Step 2 failed validation"]);
    expect(result.context).toHaveProperty("step1Context", "ok");
    expect(result.context).toHaveProperty("step2Context", "failed");
  });

  it("should return valid if all steps pass", async () => {
    const mockStep1: any = {
      execute: (context: any, input: any) => ({
        isValid: true,
        errors: [],
        context: { ...context, step1Context: "ok" },
      }),
    };
    const mockStep2: any = {
      execute: (context: any, input: any) => ({
        isValid: true,
        errors: [],
        context: { ...context, step2Context: "ok" },
      }),
    };
    const pipeline = new StructuredToolInputValidationPipelineV34([mockStep1, mockStep2]);

    const result = await pipeline.run({}, { toolInput: "valid" });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.context).toHaveProperty("step1Context", "ok");
    expect(result.context).toHaveProperty("step2Context", "ok");
  });

  it("should handle an empty pipeline gracefully", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV34([]);

    const result = await pipeline.run({}, { toolInput: "any" });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.context).toEqual({});
  });
});