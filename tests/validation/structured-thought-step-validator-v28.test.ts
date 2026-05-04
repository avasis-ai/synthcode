import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV28 } from "../src/validation/structured-thought-step-validator-v28";

describe("StructuredThoughtStepValidatorV28", () => {
  it("should validate a basic valid structured thought step", async () => {
    const validator = new StructuredThoughtStepValidatorV28({} as any);
    const validStep: StructuredThoughtStep = {
      step_id: "step1",
      thought: "This is a valid thought step.",
    };
    await expect(validator.validate(validStep)).resolves.toBe(true);
  });

  it("should validate a structured thought step with reasoning and action", async () => {
    const validator = new StructuredThoughtStepValidatorV28({} as any);
    const validStepWithDetails: StructuredThoughtStep = {
      step_id: "step2",
      thought: "I need to call a tool.",
      reasoning: {
        references_step_id: "step1",
        justification: "Because the thought step before required an action.",
      },
      action: {
        type: "tool_call",
        tool_name: "search",
        input: { query: "vitest" },
      },
    };
    await expect(validator.validate(validStepWithDetails)).resolves.toBe(true);
  });

  it("should fail validation if step_id or thought is missing", async () => {
    const validator = new StructuredThoughtStepValidatorV28({} as any);
    const invalidStep: Partial<StructuredThoughtStep> = {
      step_id: "step3",
      // thought is missing
    };
    await expect(validator.validate(invalidStep as StructuredThoughtStep)).rejects.toThrow();
  });
});