import { describe, it, expect } from "vitest";
import { ChainBuilder } from "../src/validation/structured-tool-output-validation-chain-builder-v133-advanced-advanced";

describe("ChainBuilder", () => {
  it("should initialize correctly", () => {
    const builder = new ChainBuilder();
    expect(builder).toBeInstanceOf(ChainBuilder);
  });

  it("should allow adding multiple validation steps", async () => {
    const builder = new ChainBuilder();
    const step1: ValidationStep = async (context, input) => ({
      result: { isValid: true, errors: [] },
      output: { step1Output: "data1" },
    });
    const step2: ValidationStep = async (context, input) => ({
      result: { isValid: true, errors: [] },
      output: { step2Output: "data2" },
    });

    builder.addStep(step1);
    builder.addStep(step2);

    // A simple check to ensure the internal state reflects the added steps (though we can't easily test private members, we test the execution)
    const context = {};
    const input = {};
    const result = await builder.build(context, input);

    expect(result.isValid).toBe(true);
    expect(result.output).toHaveProperty("step1Output", "data1");
    expect(result.output).toHaveProperty("step2Output", "data2");
  });

  it("should propagate validation failures correctly", async () => {
    const builder = new ChainBuilder();
    const failingStep: ValidationStep = async (context, input) => ({
      result: { isValid: false, errors: ["Validation failed at step X"] },
      output: { stepXOutput: null },
    });
    const subsequentStep: ValidationStep = async (context, input) => ({
      result: { isValid: true, errors: [] },
      output: { stepYOutput: "should not run" },
    });

    builder.addStep(failingStep);
    builder.addStep(subsequentStep);

    const context = {};
    const input = {};
    const result = await builder.build(context, input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Validation failed at step X");
    // Check that the output only contains data up to the point of failure, or at least doesn't contain data from the failed step's subsequent logic if the builder short-circuits correctly.
    expect(result.output).toHaveProperty("stepXOutput", null);
    expect(result.output).not.toHaveProperty("stepYOutput");
  });
});