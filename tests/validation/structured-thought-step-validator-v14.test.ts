import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV14 } from "../src/validation/structured-thought-step-validator-v14";

describe("StructuredThoughtStepValidatorV14", () => {
  it("should return isValid true for a valid structure", () => {
    const validator = new StructuredThoughtStepValidatorV14();
    const thought = { steps: [{ type: "thinking", content: "Step 1" }] };
    const schema = {
      requiredSteps: 1,
      stepSchema: [
        { type: "thinking", requiredFields: ["content"] },
      ],
    };
    const result = validator.validate(thought, schema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return isValid false and errors for missing required fields", () => {
    const validator = new StructuredThoughtStepValidatorV14();
    const thought = { steps: [{ type: "thinking", content: null }] };
    const schema = {
      requiredSteps: 1,
      stepSchema: [
        { type: "thinking", requiredFields: ["content", "metadata"] },
      ],
    };
    const result = validator.validate(thought, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field: metadata");
  });

  it("should return isValid false if the number of steps does not match schema", () => {
    const validator = new StructuredThoughtStepValidatorV14();
    const thought = { steps: [{ type: "thinking", content: "Step 1" }, { type: "thinking", content: "Step 2" }] };
    const schema = {
      requiredSteps: 1,
      stepSchema: [
        { type: "thinking", requiredFields: ["content"] },
      ],
    };
    const result = validator.validate(thought, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Expected 1 steps, but found 2");
  });
});