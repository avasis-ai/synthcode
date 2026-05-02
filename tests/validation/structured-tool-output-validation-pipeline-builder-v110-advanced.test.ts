import { describe, it, expect } from "vitest";
import {
  buildStructuredToolOutputValidationPipeline,
  StructuredToolOutputValidationPipeline,
} from "../src/validation/structured-tool-output-validation-pipeline-builder-v110-advanced";

describe("buildStructuredToolOutputValidationPipeline", () => {
  it("should build a basic pipeline with minimal necessary steps", () => {
    const pipeline = buildStructuredToolOutputValidationPipeline({});
    expect(pipeline).toBeInstanceOf(StructuredToolOutputValidationPipeline);
    expect(pipeline.validators.length).toBeGreaterThan(0);
  });

  it("should correctly incorporate custom validators when provided", () => {
    const mockValidator: any = (input: any, context: any) => ({
      isValid: true,
      errors: [],
    });
    const pipeline = buildStructuredToolOutputValidationPipeline({
      customValidators: [mockValidator],
    });
    expect(pipeline.validators).toContain(mockValidator);
  });

  it("should handle empty input gracefully", () => {
    const pipeline = buildStructuredToolOutputValidationPipeline({});
    // We expect it to build a pipeline, even if it's minimal
    expect(pipeline).toBeDefined();
  });
});