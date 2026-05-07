import { describe, it, expect } from "vitest";
import { WorkflowDefinitionEngine, WorkflowNode } from "../../../src/workflow/workflow-definition-engine";

describe("WorkflowDefinitionEngine", () => {
  it("should execute a simple linear workflow successfully", async () => {
    const mockStep1 = async (context, inputs) => ({ result: "Step 1 Output" });
    const mockStep2 = async (context, inputs) => ({ result: "Step 2 Output" });

    const workflow: WorkflowNode[] = [
      { id: "start", type: "start", description: "Start", inputs: {} },
      { id: "step1", type: "step", description: "First step", inputs: {}, action: mockStep1 },
      { id: "step2", type: "step", description: "Second step", inputs: {}, action: mockStep2 },
      { id: "end", type: "end", description: "End", inputs: {} },
    ];

    const engine = new WorkflowDefinitionEngine(workflow);
    const result = await engine.run();

    expect(result.success).toBe(true);
    expect(result.output).toEqual({
      step1: { result: "Step 1 Output" },
      step2: { result: "Step 2 Output" },
    });
  });

  it("should handle a workflow with conditional branching (mocked)", async () => {
    const mockStepA = async (context, inputs) => {
      if (inputs.condition === "A") {
        return { nextStepId: "stepB" };
      }
      return { nextStepId: "stepC" };
    };
    const mockStepB = async (context, inputs) => ({ result: "Path B taken" });
    const mockStepC = async (context, inputs) => ({ result: "Path C taken" });

    const workflow: WorkflowNode[] = [
      { id: "start", type: "start", description: "Start", inputs: {} },
      { id: "stepA", type: "step", description: "Conditional step", inputs: {}, action: mockStepA },
      { id: "stepB", type: "step", description: "Path B", inputs: {}, action: mockStepB },
      { id: "stepC", type: "step", description: "Path C", inputs: {}, action: mockStepC },
      { id: "end", type: "end", description: "End", inputs: {} },
    ];

    // Simulate condition leading to stepB
    const engine = new WorkflowDefinitionEngine(workflow);
    const result = await engine.run({ initialContext: { condition: "A" } });

    expect(result.success).toBe(true);
    expect(result.output).toHaveProperty("stepA", { nextStepId: "stepB" });
    expect(result.output).toHaveProperty("stepB", { result: "Path B taken" });
    expect(result.output).not.toHaveProperty("stepC");
  });

  it("should fail gracefully if a required step fails or encounters an error", async () => {
    const mockStep1 = async (context, inputs) => ({ result: "Success Step 1" });
    const mockStep2 = async (context, inputs) => {
      throw new Error("Step 2 failed intentionally");
    };

    const workflow: WorkflowNode[] = [
      { id: "start", type: "start", description: "Start", inputs: {} },
      { id: "step1", type: "step", description: "First step", inputs: {}, action: mockStep1 },
      { id: "step2", type: "step", description: "Failing step", inputs: {}, action: mockStep2 },
      { id: "end", type: "end", description: "End", inputs: {} },
    ];

    const engine = new WorkflowDefinitionEngine(workflow);
    const result = await engine.run();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Step 2 failed intentionally");
    expect(result.output).toHaveProperty("step1", { result: "Success Step 1" });
    expect(result.output).not.toHaveProperty("step2");
  });
});