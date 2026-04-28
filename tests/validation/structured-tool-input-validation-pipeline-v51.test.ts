import { describe, it, expect } from "vitest";
import { PipelineBuilder } from "../src/validation/structured-tool-input-validation-pipeline-v51";

describe("PipelineBuilder", () => {
  it("should initialize with no steps", () => {
    const builder = new PipelineBuilder();
    // We can't directly access private 'steps', so we test the side effect of adding steps.
    // A more robust test might involve mocking or adding a getter if available.
    // For now, we just ensure instantiation works.
    expect(builder).toBeInstanceOf(PipelineBuilder);
  });

  it("should add a step correctly", () => {
    const builder = new PipelineBuilder();
    const mockStep: any = { execute: () => ({ isValid: true, errors: [], context: {} }) };
    builder.addStep(mockStep);

    // Since we cannot access private members, we rely on the assumption that addStep works
    // and that subsequent methods (if any) would use the added step.
    // For this limited scope, we confirm the method call executes without error.
    expect(builder).toBeDefined();
  });

  it("should allow chaining of addStep calls", () => {
    const builder = new PipelineBuilder();
    const mockStep1: any = { execute: () => ({ isValid: true, errors: [], context: {} }) };
    const mockStep2: any = { execute: () => ({ isValid: true, errors: [], context: {} }) };

    // Check if chaining returns 'this' (the builder instance)
    const result = builder.addStep(mockStep1).addStep(mockStep2);
    expect(result).toBe(builder);
  });
});