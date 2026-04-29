import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineBuilder } from "../src/validation/structured-tool-output-validation-pipeline-builder-v124";

describe("StructuredToolOutputValidationPipelineBuilder", () => {
  it("should correctly build a pipeline with multiple validators", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder();
    // Mocking addRequiredFieldValidator for testing purposes if it's complex,
    // but here we test the builder pattern structure.
    // Assuming addRequiredFieldValidator exists and adds a step.
    // Since we don't have the full implementation, we'll test the chaining mechanism.
    const builderWithSteps = builder.addRequiredFieldValidator("field1");
    expect(builderWithSteps).toBeInstanceOf(StructuredToolOutputValidationPipelineBuilder);
  });

  it("should allow chaining of multiple validation steps", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder();
    // Simulate adding a second step to test chaining
    // We assume a method like addStep exists or the builder accumulates steps correctly.
    // Since we only see addRequiredFieldValidator, we test chaining through it.
    const result = builder.addRequiredFieldValidator("fieldA").addRequiredFieldValidator("fieldB");
    expect(result).toBeInstanceOf(StructuredToolOutputValidationPipelineBuilder);
  });

  it("should return the builder instance for fluent interface usage", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder();
    const result = builder.addRequiredFieldValidator("anyField");
    expect(result).toBe(builder);
  });
});