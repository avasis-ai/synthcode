import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineBuilder } from "../src/validation/structured-tool-output-validation-pipeline-builder-v119";

describe("StructuredToolOutputValidationPipelineBuilder", () => {
  it("should correctly build a pipeline with basic steps", async () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder();
    const step1 = {
      execute: async (input) => ({ isValid: true, errors: [], data: { fieldA: "valueA" } }),
      dependencies: [],
    };
    const step2 = {
      execute: async (input) => ({ isValid: true, errors: [], data: { fieldB: "valueB" } }),
      dependencies: ["step1"],
    };

    builder.addStep("step1", step1);
    builder.addStep("step2", step2);

    const pipeline = builder.build();
    expect(pipeline).toHaveLength(2);
    expect(pipeline[0].name).toBe("step1");
    expect(pipeline[1].name).toBe("step2");
  });

  it("should handle conditional steps correctly", async () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder();
    const stepA = {
      execute: async (input) => ({ isValid: true, errors: [], data: { result: "A" } }),
      dependencies: [],
    };
    const stepB = {
      execute: async (input) => ({ isValid: true, errors: [], data: { result: "B" } }),
      dependencies: ["stepA"],
    };
    const condition = (input) => (input["fieldA"] === "trigger");

    builder.addStep("stepA", stepA);
    builder.addConditionalStep("stepB", condition, stepB);

    const pipeline = builder.build();
    expect(pipeline).toHaveLength(2);
    expect(pipeline[0].name).toBe("stepA");
    expect(pipeline[1].name).toBe("stepB");
  });

  it("should build an empty pipeline if no steps are added", async () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder();
    const pipeline = builder.build();
    expect(pipeline).toHaveLength(0);
  });
});