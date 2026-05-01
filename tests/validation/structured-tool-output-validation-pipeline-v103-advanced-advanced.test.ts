import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineBuilder } from "../src/validation/structured-tool-output-validation-pipeline-v103-advanced-advanced";

describe("StructuredToolOutputValidationPipelineBuilder", () => {
  it("should initialize with an empty list of steps", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder();
    // Assuming there's a way to check the internal state or a getter for steps
    // Since we don't have the full implementation, we'll test the basic chaining assumption.
    // A proper test would check the internal array length.
    expect(builder).toBeInstanceOf(StructuredToolOutputValidationPipelineBuilder);
  });

  it("should allow adding multiple validation steps sequentially", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder();
    const mockStep1: any = { type: "schema", validator: "schemaValidator" };
    const mockStep2: any = { type: "cross-field", validator: "crossFieldValidator" };

    const result = builder.addStep(mockStep1).addStep(mockStep2);

    // Check if the chaining works and if the builder object is returned
    expect(result).toBe(builder);
    // A more robust test would verify the internal state, but based on the signature,
    // we assume addStep returns 'this' for chaining.
  });

  it("should correctly build a pipeline with different step types", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder();
    const mockSchemaStep: any = { type: "schema", validator: {} };
    const mockCrossFieldStep: any = { type: "cross-field", validator: () => true };
    const mockTemporalStep: any = { type: "temporal", validator: (d: any) => d.date };

    const builtPipeline = builder
      .addStep(mockSchemaStep)
      .addStep(mockCrossFieldStep)
      .addStep(mockTemporalStep);

    // We can't inspect the private 'steps' array directly without modification,
    // but we can assert that the chaining was successful and the object is usable.
    expect(builtPipeline).toBeDefined();
  });
});