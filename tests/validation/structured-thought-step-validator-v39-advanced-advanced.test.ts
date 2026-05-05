import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV39AdvancedAdvance } from "../src/validation/structured-thought-step-validator-v39-advanced-advanced";

describe("StructuredThoughtStepValidatorV39AdvancedAdvance", () => {
  const validator = new StructuredThoughtStepValidatorV39AdvancedAdvance();

  it("should validate a correctly structured sequence of steps", () => {
    const mockSteps: any[] = [
      { type: "thought", content: "Initial thought" },
      { type: "tool_use", content: "Tool call" },
      { type: "text", content: "Final answer" },
    ];
    const mockContextGraph = new Map<string, any>();
    const result = validator.validateStepSequence(mockSteps, mockContextGraph);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect cross-step dependencies violations", () => {
    const mockStep: any = { type: "text", content: "Needs resource X" };
    const mockHistory: any[] = [
      { type: "thought", content: "Thought about X" },
    ];
    const result = validator.checkCrossStepDependencies(mockStep, mockHistory);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Cross-step dependency violation detected.");
  });

  it("should check resource constraints for a set of steps", () => {
    const mockSteps: any[] = [
      { type: "tool_use", content: "Tool A" },
      { type: "tool_use", content: "Tool B" },
    ];
    const result = validator.checkResourceConstraints(mockSteps);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Resource constraint violation: Too many tool uses.");
  });
});