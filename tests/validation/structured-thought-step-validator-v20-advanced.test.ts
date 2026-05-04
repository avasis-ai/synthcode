import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV20Advanced } from "../src/validation/structured-thought-step-validator-v20-advanced";

describe("StructuredThoughtStepValidatorV20Advanced", () => {
  it("should validate a simple, valid sequence of steps", () => {
    const validator = new StructuredThoughtStepValidatorV20Advanced(10);
    const steps = [
      { type: "ThinkingBlock", content: "Initial thought." },
      { type: "ContentBlock", content: "User input." },
      { type: "ToolUseBlock", content: "Tool call." },
    ];
    const result = validator.validate(steps);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return errors for missing required dependency steps", () => {
    const validator = new StructuredThoughtStepValidatorV20Advanced(10);
    // Assume a dependency rule requires step 2 to follow step 0
    validator.addDependencyRule({ sourceStepIndex: 0, requiredTargetStepIndex: 2, dependencyKey: "ToolUse" });
    const steps = [
      { type: "ThinkingBlock", content: "Step 0" },
      { type: "ContentBlock", content: "Step 1" },
      // Step 2 is missing or incorrect type relative to dependency
    ];
    const result = validator.validate(steps);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Dependency violation: Step 2 requires a ToolUse block after Step 0.");
  });

  it("should handle an empty list of steps gracefully", () => {
    const validator = new StructuredThoughtStepValidatorV20Advanced(10);
    const steps: any[] = [];
    const result = validator.validate(steps);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});