import { describe, it, expect } from "vitest";
import { ValidationPipelineBuilder } from "../src/validation/structured-tool-input-validation-pipeline-builder-v104";

describe("ValidationPipelineBuilder", () => {
  it("should build a pipeline with a single step correctly", async () => {
    const builder = new ValidationPipelineBuilder();
    builder.addStep(async (context) => ({ isValid: true, errors: [], context: { ...context, step1: "ok" } }));
    const pipeline = builder.build();

    const result = await pipeline.execute({});
    expect(result.isValid).toBe(true);
    expect(result.context).toEqual({ step1: "ok" });
  });

  it("should execute multiple steps sequentially and accumulate context", async () => {
    const builder = new ValidationPipelineBuilder();
    builder.addStep(async (context) => ({ isValid: true, errors: [], context: { ...context, step1: "data1" } }));
    builder.addStep(async (context) => ({ isValid: true, errors: [], context: { ...context, step2: "data2" } }));
    const pipeline = builder.build();

    const result = await pipeline.execute({});
    expect(result.isValid).toBe(true);
    expect(result.context).toEqual({ step1: "data1", step2: "data2" });
  });

  it("should stop execution and report errors if any step fails validation", async () => {
    const builder = new ValidationPipelineBuilder();
    builder.addStep(async (context) => ({ isValid: true, errors: [], context: { ...context, step1: "ok" } }));
    builder.addStep(async (context) => ({ isValid: false, errors: ["Validation failed in step 2"], context: { ...context, step2: "fail" } }));
    builder.addStep(async (context) => ({ isValid: true, errors: [], context: { ...context, step3: "should_not_run" } }));
    const pipeline = builder.build();

    const result = await pipeline.execute({});
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Validation failed in step 2");
    // Check that context from the failing step is present, but subsequent steps are ignored
    expect(result.context).toEqual({ step1: "ok", step2: "fail" });
  });
});