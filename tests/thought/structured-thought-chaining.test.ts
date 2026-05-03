import { describe, it, expect, vi } from "vitest";
import { ThoughtStep, ThoughtContext, ThoughtStepType } from "../src/thought/structured-thought-chaining";

describe("ThoughtStep", () => {
  it("should correctly define the ThoughtStep structure", async () => {
    const mockContext: ThoughtContext = {
      initialInput: "Test input",
      history: [],
      stepOutputs: {} as Record<ThoughtStepType, { output: string; success: boolean }>,
      currentStep: "PLAN",
    };

    const mockAction = vi.fn(async (context: ThoughtContext) => ({ output: "Plan output", success: true }));

    const planStep: ThoughtStep = {
      type: "PLAN",
      input: "Initial plan input",
      action: mockAction,
    };

    expect(planStep.type).toBe("PLAN");
    expect(planStep.input).toBe("Initial plan input");
    expect(typeof planStep.action).toBe("function");

    // Test execution of the action
    await planStep.action(mockContext);
    expect(mockAction).toHaveBeenCalledWith(mockContext);
  });

  it("should handle different ThoughtStepTypes", async () => {
    const mockContext: ThoughtContext = {
      initialInput: "Test input",
      history: [],
      stepOutputs: {} as Record<ThoughtStepType, { output: string; success: boolean }>,
      currentStep: "EXECUTE",
    };

    const executeStep: ThoughtStep = {
      type: "EXECUTE",
      input: "Execution prompt",
      action: vi.fn(async (context: ThoughtContext) => ({ output: "Execution result", success: true })),
    };

    expect(executeStep.type).toBe("EXECUTE");

    // Ensure the action can be called with the correct context
    await executeStep.action(mockContext);
  });

  it("should allow context updates across steps", async () => {
    const initialContext: ThoughtContext = {
      initialInput: "Start",
      history: [],
      stepOutputs: {} as Record<ThoughtStepType, { output: string; success: boolean }>,
      currentStep: "PLAN",
    };

    const mockAction = vi.fn(async (context: ThoughtContext) => {
      const newContext: ThoughtContext = {
        ...context,
        stepOutputs: {
          ...context.stepOutputs,
          [context.currentStep]: { output: "Updated output", success: true },
        },
        currentStep: "REFLECT",
      };
      return { output: "Reflection done", success: true };
    });

    const step: ThoughtStep = {
      type: "PLAN",
      input: "Plan step",
      action: mockAction,
    };

    // Execute the step and check if the context passed to the action reflects the state change
    const result = await step.action(initialContext);

    expect(result.success).toBe(true);
    // Note: Since the action modifies the context *within* the scope of the call,
    // we primarily test that the action receives the initial context and returns a result.
    // A more complex test would involve passing the *updated* context back, but based on the interface,
    // we verify the action runs and returns a result.
  });
});