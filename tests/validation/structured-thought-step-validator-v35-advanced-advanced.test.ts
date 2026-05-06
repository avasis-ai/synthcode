import { describe, it, expect } from "vitest";
import { StepValidator } from "../src/validation/structured-thought-step-validator-v35-advanced-advanced";

describe("StepValidator", () => {
  it("should return valid result when input data matches expected structure", () => {
    const validator = new StepValidator();
    const stepInput = {
      stepIndex: 1,
      data: {
        thought: "This is a valid thought.",
        action: "call_tool",
        toolName: "search",
        toolArguments: { query: "test" },
      },
    };
    const context = {
      history: [],
      currentState: { user: "initial" },
    };
    const result = validator.validate(stepInput, context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid result with errors when required fields are missing", () => {
    const validator = new StepValidator();
    const stepInput = {
      stepIndex: 2,
      data: {
        thought: "Missing action data.",
        // action is missing
      },
    };
    const context = {
      history: [{ role: "user", content: "some message" }],
      currentState: { user: "updated" },
    };
    const result = validator.validate(stepInput, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Action is required");
  });

  it("should update context correctly when validation passes", () => {
    const validator = new StepValidator();
    const stepInput = {
      stepIndex: 3,
      data: {
        thought: "Final step thought.",
        action: "finalize",
        toolName: undefined,
        toolArguments: undefined,
      },
    };
    const context = {
      history: [],
      currentState: { stepCount: 1 },
    };
    const result = validator.validate(stepInput, context);
    expect(result.isValid).toBe(true);
    expect(result.updatedContext).toEqual({
      ...context.currentState,
      stepCount: 2,
      lastAction: "finalize",
    });
  });
});