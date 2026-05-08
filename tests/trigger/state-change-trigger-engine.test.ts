import { describe, it, expect } from "vitest";
import { StateChangeTriggerEngine, Trigger, WorkflowContext } from "../src/trigger/state-change-trigger-engine";

describe("StateChangeTriggerEngine", () => {
  it("should correctly trigger a workflow when the state condition is met", async () => {
    const mockContext: WorkflowContext = {
      payload: { user: "test", status: "active" },
      history: [],
    };

    const mockTrigger: Trigger = {
      id: "test-trigger",
      name: "Active User Trigger",
      condition: (statePayload: any) => statePayload?.status === "active",
      execute: async (context: WorkflowContext) => {
        expect(context.payload.user).toBe("test");
        return { triggered: true, context: { ...context, history: [...context.history, { role: "bot", content: "Workflow executed" }] } };
      },
    };

    const engine = new StateChangeTriggerEngine([mockTrigger]);
    const result = await engine.run(mockContext);

    expect(result.triggered).toBe(true);
    expect(result.context.history).toHaveLength(1);
    expect(result.context.history[0].content).toBe("Workflow executed");
  });

  it("should not trigger a workflow if the state condition is not met", async () => {
    const mockContext: WorkflowContext = {
      payload: { user: "test", status: "inactive" },
      history: [],
    };

    const mockTrigger: Trigger = {
      id: "test-trigger",
      name: "Active User Trigger",
      condition: (statePayload: any) => statePayload?.status === "active",
      execute: async (context: WorkflowContext) => {
        return { triggered: true, context: { ...context, history: [...context.history, { role: "bot", content: "Workflow executed" }] } };
      },
    };

    const engine = new StateChangeTriggerEngine([mockTrigger]);
    const result = await engine.run(mockContext);

    expect(result.triggered).toBe(false);
    expect(result.context.history).toEqual([]);
  });

  it("should execute the first matching trigger and stop processing", async () => {
    const mockContext: WorkflowContext = {
      payload: { value: 10 },
      history: [],
    };

    const mockTrigger1: Trigger = {
      id: "trigger-1",
      name: "Condition 1",
      condition: (statePayload: any) => statePayload.value >= 5,
      execute: async (context: WorkflowContext) => {
        return { triggered: true, context: { ...context, history: [...context.history, { role: "bot", content: "Trigger 1 executed" }] } };
      },
    };

    const mockTrigger2: Trigger = {
      id: "trigger-2",
      name: "Condition 2",
      condition: (statePayload: any) => statePayload.value > 15,
      execute: async (context: WorkflowContext) => {
        return { triggered: true, context: { ...context, history: [...context.history, { role: "bot", content: "Trigger 2 executed" }] } };
      },
    };

    const engine = new StateChangeTriggerEngine([mockTrigger1, mockTrigger2]);
    const result = await engine.run(mockContext);

    expect(result.triggered).toBe(true);
    // Only Trigger 1 should execute because it matches and the engine stops on the first match
    expect(result.context.history).toHaveLength(1);
    expect(result.context.history[0].content).toBe("Trigger 1 executed");
  });
});