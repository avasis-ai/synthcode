import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipelineBuilderV112 } from "../src/validation/structured-tool-input-validation-pipeline-builder-v112";

describe("StructuredToolInputValidationPipelineBuilderV112", () => {
  it("should correctly build a pipeline with basic validation steps", () => {
    const builder = new StructuredToolInputValidationPipelineBuilderV112();
    const pipeline = builder.addValidator(
      (input) => ({ isValid: true, errors: [] })
    ).addValidator(
      (input) => ({ isValid: true, errors: [] })
    ).build();

    expect(typeof pipeline).toBe("function");
    // A simple check to ensure the pipeline function can be called without error
    expect(() => pipeline({})).not.toThrow();
  });

  it("should accumulate errors from multiple validators", () => {
    const builder = new StructuredToolInputValidationPipelineBuilderV112();
    const pipeline = builder.addValidator(
      (input) => ({ isValid: false, errors: ["Error A"] })
    ).addValidator(
      (input) => ({ isValid: false, errors: ["Error B"] })
    ).build();

    const result = pipeline({ key: "value" });

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error A", "Error B"]);
  });

  it("should return valid result when all validators pass", () => {
    const builder = new StructuredToolInputValidationPipelineBuilderV112();
    const pipeline = builder.addValidator(
      (input) => ({ isValid: true, errors: [] })
    ).addValidator(
      (input) => ({ isValid: true, errors: [] })
    ).build();

    const result = pipeline({ key: "value" });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});