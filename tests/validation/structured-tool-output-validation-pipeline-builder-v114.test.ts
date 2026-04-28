import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineBuilderV114 } from "../src/validation/structured-tool-output-validation-pipeline-builder-v114";

describe("StructuredToolOutputValidationPipelineBuilderV114", () => {
  it("should correctly build a pipeline with a single validator", () => {
    const validator = (output: unknown) => ({ isValid: true });
    const builder = new StructuredToolOutputValidationPipelineBuilderV114();
    const pipeline = builder.addStep({ validator });

    expect(pipeline).toHaveLength(1);
    expect(pipeline[0].validator).toBe(validator);
  });

  it("should correctly build a pipeline with multiple steps and conditions", () => {
    const validator1 = (output: unknown) => ({ isValid: true });
    const condition1 = (output: unknown) => true;
    const validator2 = (output: unknown) => ({ isValid: true });
    const condition2 = (output: unknown) => false;

    const builder = new StructuredToolOutputValidationPipelineBuilderV114();
    builder.addStep({ validator: validator1, condition: condition1 });
    builder.addStep({ validator: validator2, condition: condition2 });

    const pipeline = builder.build();

    expect(pipeline).toHaveLength(2);
    expect(pipeline[0].validator).toBe(validator1);
    expect(pipeline[0].condition).toBe(condition1);
    expect(pipeline[1].validator).toBe(validator2);
    expect(pipeline[1].condition).toBe(condition2);
  });

  it("should return an empty pipeline if no steps are added", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilderV114();
    const pipeline = builder.build();

    expect(pipeline).toHaveLength(0);
  });
});