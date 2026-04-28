import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineV25 } from "../src/validation/structured-tool-output-validation-pipeline-v25";
import { ToolResultMessage } from "../src/validation/types";

describe("StructuredToolOutputValidationPipelineV25", () => {
  it("should return valid report when all steps pass", () => {
    const mockStep1: any = { validate: (output: any, context: any) => ({ isValid: true, errors: [], details: {} }) };
    const mockStep2: any = { validate: (output: any, context: any) => ({ isValid: true, errors: [], details: {} }) };
    const pipeline = new StructuredToolOutputValidationPipelineV25([mockStep1, mockStep2]);
    const mockOutput: ToolResultMessage = { toolName: "test", result: "success" };

    const report = pipeline.validate(mockOutput, {});

    expect(report.isValid).toBe(true);
    expect(report.errors).toEqual([]);
  });

  it("should aggregate errors from multiple failing steps", () => {
    const mockStep1: any = { validate: (output: any, context: any) => ({ isValid: false, errors: ["Error in step 1"], details: {} }) };
    const mockStep2: any = { validate: (output: any, context: any) => ({ isValid: false, errors: ["Error in step 2"], details: {} }) };
    const pipeline = new StructuredToolOutputValidationPipelineV25([mockStep1, mockStep2]);
    const mockOutput: ToolResultMessage = { toolName: "test", result: "failure" };

    const report = pipeline.validate(mockOutput, {});

    expect(report.isValid).toBe(false);
    expect(report.errors).toEqual(["Error in step 1", "Error in step 2"]);
  });

  it("should return the correct details from the last failing step", () => {
    const mockStep1: any = { validate: (output: any, context: any) => ({ isValid: true, errors: [], details: { step1: "ok" } }) };
    const mockStep2: any = { validate: (output: any, context: any) => ({ isValid: false, errors: ["Error in step 2"], details: { step2: "failed" } }) };
    const pipeline = new StructuredToolOutputValidationPipelineV25([mockStep1, mockStep2]);
    const mockOutput: ToolResultMessage = { toolName: "test", result: "failure" };

    const report = pipeline.validate(mockOutput, {});

    expect(report.details).toEqual({ step2: "failed" });
  });
});