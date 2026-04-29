import { describe, it, expect } from "vitest";
import { structuredToolInputValidationPipelineBuilderV113 } from "../src/validation/structured-tool-input-validation-pipeline-builder-v113";

describe("structuredToolInputValidationPipelineBuilderV113", () => {
  it("should correctly build a pipeline with basic validation steps", () => {
    const builder = structuredToolInputValidationPipelineBuilderV113();
    const pipeline = builder.addStep({
      validator: (data, context) => ({
        isValid: true,
        errors: [],
        data: { requiredField: (data as any).requiredField || "default" },
      }),
      condition: (context) => context.shouldRun,
    }).build();

    expect(pipeline).toBeDefined();
    expect(Array.isArray(pipeline.steps)).toBe(true);
    expect(pipeline.steps.length).toBe(1);
  });

  it("should handle multiple validation steps with different conditions", () => {
    const builder = structuredToolInputValidationPipelineBuilderV113();
    const pipeline = builder.addStep({
      validator: (data, context) => ({
        isValid: true,
        errors: [],
        data: { step1: "ok" },
      }),
      condition: (context) => context.step1 === "ok",
    }).addStep({
      validator: (data, context) => ({
        isValid: true,
        errors: [],
        data: { step2: "ok" },
      }),
      condition: (context) => context.step1 === "ok",
    }).build();

    expect(pipeline.steps.length).toBe(2);
  });

  it("should return an empty pipeline if no steps are added", () => {
    const builder = structuredToolInputValidationPipelineBuilderV113();
    const pipeline = builder.build();

    expect(pipeline.steps).toEqual([]);
  });
});