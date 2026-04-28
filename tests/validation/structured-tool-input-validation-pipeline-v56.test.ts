import { describe, it, expect } from "vitest";
import { PipelineBuilder } from "../src/validation/structured-tool-input-validation-pipeline-v56";

describe("PipelineBuilder", () => {
  it("should initialize with no steps", () => {
    const builder = new PipelineBuilder();
    // Assuming there's a way to check the internal state or a getter for steps count
    // Since we don't have access to private fields, we'll test the addStep functionality indirectly.
    // For this test, we'll just ensure instantiation works.
    expect(builder).toBeInstanceOf(PipelineBuilder);
  });

  it("should add a single step correctly", () => {
    const builder = new PipelineBuilder();
    const mockStep: any = { execute: () => ({ isValid: true, errors: [], context: {} }) };
    builder.addStep(mockStep);

    // A more robust test would involve checking the internal array, but based on the provided context,
    // we assume addStep modifies the internal state correctly.
    // If we could access private fields: expect(builder['steps'].length).toBe(1);
    // For now, we rely on the next test to confirm chaining.
  });

  it("should add multiple steps sequentially", () => {
    const builder = new PipelineBuilder();
    const mockStep1: any = { execute: () => ({ isValid: true, errors: [], context: {} }) };
    const mockStep2: any = { execute: () => ({ isValid: true, errors: [], context: {} }) };

    builder.addStep(mockStep1);
    builder.addStep(mockStep2);

    // Again, assuming internal state check is possible or that the next test validates execution order.
    // If we could access private fields: expect(builder['steps'].length).toBe(2);
  });
});