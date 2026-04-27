import { describe, it, expect } from "vitest";
import { FlowStep, ExecutionContext } from "../src/tool/execution-flow-guard";

describe("FlowStep", () => {
  it("should execute the step's logic with the given context", async () => {
    const mockContext: ExecutionContext = {
      messages: [{ role: "user", content: "Test" }],
      contextData: { initial: true },
    };
    const mockStep: FlowStep = {
      id: "testStep",
      execute: async (context: ExecutionContext) => ({
        result: "Execution successful",
        contextUpdate: { updated: true },
        success: true,
      }),
    };

    const result = await mockStep.execute(mockContext);

    expect(result.success).toBe(true);
    expect(result.result).toBe("Execution successful");
    expect(result.contextUpdate).toEqual({ updated: true });
  });

  it("should handle step execution failure correctly", async () => {
    const mockContext: ExecutionContext = {
      messages: [],
      contextData: {},
    };
    const mockStep: FlowStep = {
      id: "failingStep",
      execute: async (context: ExecutionContext) => ({
        result: null,
        contextUpdate: {},
        success: false,
      }),
    };

    const result = await mockStep.execute(mockContext);

    expect(result.success).toBe(false);
    expect(result.result).toBeNull();
  });

  it("should correctly apply context updates from the step result", async () => {
    const mockContext: ExecutionContext = {
      messages: [{ role: "user", content: "Initial" }],
      contextData: { counter: 1 },
    };
    const mockStep: FlowStep = {
      id: "updateStep",
      execute: async (context: ExecutionContext) => ({
        result: "Updated",
        contextUpdate: { counter: 2, source: "step" },
        success: true,
      }),
    };

    const result = await mockStep.execute(mockContext);

    expect(result.contextUpdate).toEqual({ counter: 2, source: "step" });
  });
});