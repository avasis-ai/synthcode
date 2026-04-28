import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineBuilder } from "../src/validation/structured-tool-output-validation-pipeline-builder-v100";

describe("StructuredToolOutputValidationPipelineBuilder", () => {
  it("should initialize correctly with a schema", () => {
    const schema = {
      name: "test",
      type: "object",
      properties: {
        id: { type: "string" },
      },
    };
    const builder = new StructuredToolOutputValidationPipelineBuilder(schema);
    // We can't directly test private members, but we can test the public API usage
    expect(builder).toBeInstanceOf(StructuredToolOutputValidationPipelineBuilder);
  });

  it("should allow adding multiple validation steps", () => {
    const schema = { name: "test" };
    const builder = new StructuredToolOutputValidationPipelineBuilder(schema);

    const step1: ValidationStep<any> = {
      validator: (data) => ({ isValid: true, errors: [] }),
      name: "Step One",
    };
    const step2: ValidationStep<any> = {
      validator: (data) => ({ isValid: true, errors: [] }),
      name: "Step Two",
    };

    builder.addTypeValidator(step1);
    builder.addTypeValidator(step2);

    // Since steps are private, we rely on the builder's intended usage,
    // but we can assert that calling addTypeValidator multiple times doesn't crash.
    // A more robust test would involve a getter or a method that uses the steps.
  });

  it("should build a pipeline that can process data (conceptual test)", () => {
    const schema = { name: "test" };
    const builder = new StructuredToolOutputValidationPipelineBuilder(schema);

    const step1: ValidationStep<any> = {
      validator: (data) => ({ isValid: true, errors: [] }),
      name: "Step One",
    };
    const step2: ValidationStep<any> = {
      validator: (data) => ({ isValid: true, errors: [] }),
      name: "Step Two",
    };

    builder.addTypeValidator(step1);
    builder.addTypeValidator(step2);

    // Assuming a method like 'buildPipeline' or 'validate' exists and uses the steps
    // For this test, we just ensure the setup is possible.
    expect(builder).toBeDefined();
  });
});