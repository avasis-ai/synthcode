import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipeline } from "../src/validation/structured-tool-output-validation-pipeline-builder-v108";

describe("StructuredToolOutputValidationPipeline", () => {
  it("should run all provided validation steps sequentially", () => {
    const mockStep1: any = {
      execute: (context: any) => ({ isValid: true, errors: [], context: { step1: "ok" } }),
    };
    const mockStep2: any = {
      execute: (context: any) => ({ isValid: true, errors: [], context: { step2: "ok" } }),
    };

    const pipeline = new StructuredToolOutputValidationPipeline([mockStep1, mockStep2]);
    const initialContext: any = { inputData: {}, history: [] };

    const result = pipeline.run(initialContext);

    expect(result.isValid).toBe(true);
    expect(result.context).toEqual({ step1: "ok", step2: "ok" });
  });

  it("should stop and return invalid if any step fails validation", () => {
    const mockStep1: any = {
      execute: (context: any) => ({ isValid: true, errors: [], context: { step1: "ok" } }),
    };
    const mockStep2: any = {
      execute: (context: any) => ({ isValid: false, errors: ["Invalid data in step 2"], context: { step2: "fail" } }),
    };
    const mockStep3: any = {
      execute: (context: any) => ({ isValid: true, errors: [], context: { step3: "should not run" } }),
    };

    const pipeline = new StructuredToolOutputValidationPipeline([mockStep1, mockStep2, mockStep3]);
    const initialContext: any = { inputData: {}, history: [] };

    const result = pipeline.run(initialContext);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Invalid data in step 2"]);
    // Check if context only contains data up to the failing step
    expect(result.context).toEqual({ step1: "ok", step2: "fail" });
  });

  it("should return valid with empty context if no steps are provided", () => {
    const pipeline = new StructuredToolOutputValidationPipeline([]);
    const initialContext: any = { inputData: {}, history: [] };

    const result = pipeline.run(initialContext);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.context).toEqual({});
  });
});