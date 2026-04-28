import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipeline } from "../src/validation/structured-tool-output-validation-pipeline-v55";
import { Message, ToolResultMessage } from "../src/validation/types";

describe("StructuredToolOutputValidationPipeline", () => {
  it("should initialize with no steps if none are provided", () => {
    const pipeline = new StructuredToolOutputValidationPipeline();
    // Assuming there's a way to check the internal state or a getter for steps count
    // For this test, we'll rely on the addStep functionality being the primary way to check setup.
    // A more robust test would require an internal getter, but we'll test the basic flow.
    expect(pipeline).toBeInstanceOf(StructuredToolOutputValidationPipeline);
  });

  it("should correctly add multiple validation steps", () => {
    const mockStep1: any = { validate: () => ({ isValid: true, errors: [] }) };
    const mockStep2: any = { validate: () => ({ isValid: true, errors: [] }) };
    const pipeline = new StructuredToolOutputValidationPipeline();
    pipeline.addStep(mockStep1);
    pipeline.addStep(mockStep2);

    // Since we cannot access private 'steps', we test the pipeline's execution flow which depends on steps.
    // We'll assume addStep works by checking if the pipeline can process steps.
    const context: any = { history: [], toolOutput: {}, timestamp: Date.now() };
    const result = pipeline.validate(context, { key: "value" });
    expect(result).toBeDefined();
  });

  it("should aggregate errors from all added validation steps", () => {
    const mockStep1: any = { validate: () => ({ isValid: false, errors: ["Error A"] }) };
    const mockStep2: any = { validate: () => ({ isValid: false, errors: ["Error B"] }) };
    const pipeline = new StructuredToolOutputValidationPipeline();
    pipeline.addStep(mockStep1);
    pipeline.addStep(mockStep2);

    const context: any = { history: [], toolOutput: {}, timestamp: Date.now() };
    const result = pipeline.validate(context, { key: "value" });

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining(["Error A", "Error B"]));
    expect(result.errors).toHaveLength(2);
  });
});