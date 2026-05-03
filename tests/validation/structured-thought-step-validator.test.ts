import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidator } from "../src/validation/structured-thought-step-validator";

describe("StructuredThoughtStepValidator", () => {
  it("should validate a correctly structured thought step", () => {
    const validator = new StructuredThoughtStepValidator();
    const step: any = {
      stepType: "plan",
      content: {
        goal: "Test goal",
        steps: [1, 2, 3],
      },
    };
    const schema: any = {
      stepType: { required: true, type: "string" },
      content: { required: true, type: "object" },
    };
    const result = validator.validate(step, schema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return validation errors for missing required fields", () => {
    const validator = new StructuredThoughtStepValidator();
    const step: any = {
      stepType: "reflect",
      content: {},
    };
    const schema: any = {
      stepType: { required: true, type: "string" },
      content: { required: true, type: "object" },
      metadata: { required: true, type: "object" },
    };
    const result = validator.validate(step, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("metadata");
  });

  it("should handle custom validation failures", () => {
    const validator = new StructuredThoughtStepValidator();
    const step: any = {
      stepType: "execute",
      content: {
        result: "valid",
      },
    };
    const schema: any = {
      stepType: { required: true, type: "string" },
      content: {
        required: true,
        type: "object",
        customValidator: (value: any) => typeof value.result === "string" && value.result.length > 0,
      },
    };
    const result = validator.validate(step, schema);
    expect(result.isValid).toBe(true);

    const invalidStep: any = {
      stepType: "execute",
      content: {
        result: "",
      },
    };
    const resultInvalid = validator.validate(invalidStep, schema);
    expect(resultInvalid.isValid).toBe(false);
    expect(resultInvalid.errors).toHaveLength(1);
  });
});