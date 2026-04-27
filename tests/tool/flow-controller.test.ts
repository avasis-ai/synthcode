import { describe, it, expect } from "vitest";
import { FlowController } from "../src/tool/flow-controller";
import { ToolDefinition } from "../src/tool/types";

describe("FlowController", () => {
  it("should execute a simple successful flow", async () => {
    const mockTool1: ToolDefinition = {
      name: "tool1",
      execute: async (input, context) => ({ result1: "success1" }),
    };
    const mockTool2: ToolDefinition = {
      name: "tool2",
      execute: async (input, context) => ({ result2: "success2" }),
    };

    const flow = [
      {
        tool: mockTool1,
        inputMapping: {
          a: { source: "context", mapFrom: "initial_context_a" },
        },
      },
      {
        tool: mockTool2,
        inputMapping: {
          b: { source: "previous_output", mapFrom: "result1" },
        },
      },
    ];

    const controller = new FlowController(flow);
    const result = await controller.run({ initial_context_a: "context_value" });

    expect(result).toEqual({ result1: "success1", result2: "success2" });
  });

  it("should handle tool failure and execute fallback", async () => {
    const failingTool: ToolDefinition = {
      name: "failingTool",
      execute: async () => {
        throw new Error("Tool failed intentionally");
      },
    };
    const fallbackTool: ToolDefinition = {
      name: "fallbackTool",
      execute: async (input, context) => ({ fallback_result: "fallback_success" }),
    };

    const flow = [
      {
        tool: failingTool,
        inputMapping: { a: { source: "context", mapFrom: "context_key" } },
        onFailure: {
          maxRetries: 1,
          fallbackTool: fallbackTool,
          fallbackInputMapping: { b: { source: "context", mapFrom: "context_key" } },
        },
      },
    ];

    const controller = new FlowController(flow);
    const result = await controller.run({ context_key: "initial_context" });

    expect(result).toEqual({ fallback_result: "fallback_success" });
  });

  it("should stop execution if fallback fails after all retries", async () => {
    const failingTool: ToolDefinition = {
      name: "failingTool",
      execute: async () => {
        throw new Error("Tool failed");
      },
    };
    const fallbackTool: ToolDefinition = {
      name: "fallbackTool",
      execute: async () => {
        throw new Error("Fallback failed");
      },
    };

    const flow = [
      {
        tool: failingTool,
        inputMapping: {},
        onFailure: {
          maxRetries: 1,
          fallbackTool: fallbackTool,
          fallbackInputMapping: {},
        },
      },
    ];

    const controller = new FlowController(flow);
    // Expecting the final error to bubble up if all retries/fallbacks fail
    await expect(controller.run({})).rejects.toThrow("Fallback failed");
  });
});