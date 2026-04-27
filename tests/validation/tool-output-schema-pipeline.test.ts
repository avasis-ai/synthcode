import { describe, it, expect } from "vitest";
import { ToolOutputSchemaPipeline, ValidationError, ValidationStep } from "../src/validation/tool-output-schema-pipeline";

describe("ToolOutputSchemaPipeline", () => {
  it("should pass validation when all steps succeed", () => {
    const mockSteps: ValidationStep[] = [
      { name: "step1", validate: (output) => ({ isValid: true }) },
      { name: "step2", validate: (output) => ({ isValid: true }) },
    ];
    const pipeline = new ToolOutputSchemaPipeline(mockSteps, {});
    const result = pipeline.run({ key: "value" });
    expect(result).toBeUndefined();
  });

  it("should stop and return the first error encountered", () => {
    const mockSteps: ValidationStep[] = [
      { name: "step1", validate: (output) => ({ isValid: true }) },
      { name: "step2", validate: (output) => ({ isValid: false, error: { stepName: "step2", message: "Error in step 2" } }) },
      { name: "step3", validate: (output) => ({ isValid: true }) }, // Should not run
    ];
    const pipeline = new ToolOutputSchemaPipeline(mockSteps, {});
    const result = pipeline.run({ key: "value" });
    expect(result).toEqual({ stepName: "step2", message: "Error in step 2" });
  });

  it("should return null if no steps are provided", () => {
    const mockSteps: ValidationStep[] = [];
    const pipeline = new ToolOutputSchemaPipeline(mockSteps, {});
    const result = pipeline.run({ key: "value" });
    expect(result).toBeNull();
  });
});