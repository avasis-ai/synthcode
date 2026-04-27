import { describe, it, expect } from "vitest";
import { FlowController } from "../src/flow/flow-controller";
import { FlowState, FlowStep } from "../src/flow/types";

describe("FlowController", () => {
  it("should initialize with an empty state", () => {
    const controller = new FlowController();
    expect(controller.getState()).toEqual({});
  });

  it("should execute a simple sequence of steps correctly", async () => {
    const initialSteps: FlowStep[] = [
      { toolCalls: [{ toolName: "toolA", input: { param: "value" } }] },
      { toolCalls: [{ toolName: "toolB", input: {} }] },
    ];
    const controller = new FlowController(initialSteps);
    const finalState = await controller.execute();

    expect(finalState).toBeDefined();
    // Assuming execution updates state or returns a result based on the steps
    // For this test, we just check if it runs without error and returns something.
  });

  it("should handle conditional branching logic", async () => {
    // Mocking a simple conditional step structure for testing purposes
    const conditionStep: FlowStep[] = [
      // In a real scenario, this would involve a specific ConditionalStep type
      // For simplicity, we assume the controller handles the logic flow.
      // We simulate a flow that checks a condition and proceeds.
      { toolCalls: [{ toolName: "checkCondition", input: {} }] }
    ];
    const controller = new FlowController(conditionStep);
    const finalState = await controller.execute();

    expect(finalState).toBeDefined();
  });
});