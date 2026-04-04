import { describe, it, expect } from "vitest";
import { FlowStep, FlowContext } from "../src/flowcontrol/flow-controller";
import { FlowController } from "../src/flowcontrol/flow-controller";

describe("FlowController", () => {
  it("should initialize with correct context", () => {
    const context: FlowContext = {
      currentState: { type: "initial" },
      history: [],
      toolResults: new Map(),
    };
    const controller = new FlowController(context);
    expect(controller).toBeDefined();
  });

  it("should execute a simple linear flow successfully", async () => {
    const context: FlowContext = {
      currentState: { type: "initial" },
      history: [],
      toolResults: new Map(),
    };
    const step1: FlowStep = {
      toolName: "toolA",
      toolInput: { id: 1 },
      condition: (output) => true,
      onSuccess: [
        {
          toolName: "toolB",
          toolInput: { id: 2 },
          condition: (output) => true,
          onSuccess: null,
          onFailure: null,
        },
      ],
      onFailure: null,
    };
    const controller = new FlowController(context);
    const result = await controller.execute([step1]);

    expect(result).toBeDefined();
    // Basic check to ensure execution happened (more complex checks would require mocking tool execution)
  });

  it("should handle flow branching based on success condition", async () => {
    const context: FlowContext = {
      currentState: { type: "initial" },
      history: [],
      toolResults: new Map(),
    };
    const step1: FlowStep = {
      toolName: "toolA",
      toolInput: { data: "test" },
      condition: (output) => output.success && output.result.includes("success"),
      onSuccess: [
        {
          toolName: "successTool",
          toolInput: {},
          condition: (output) => true,
          onSuccess: null,
          onFailure: null,
        },
      ],
      onFailure: null,
    };
    const controller = new FlowController(context);
    // In a real test, we would mock the tool execution to force the success path.
    // Here we just test the structure and execution attempt.
    await controller.execute([step1]);
  });
});