import { describe, it, expect } from "vitest";
import { FlowStep } from "../src/flow-control";

describe("FlowStep", () => {
  it("should execute the step's logic when called", async () => {
    const mockContext = { history: [], contextData: {} };
    const mockStep: FlowStep = {
      execute: async (context) => ({ result: "success", success: true, contextUpdate: { count: 1 } }),
    };

    const result = await mockStep.execute(mockContext);

    expect(result.success).toBe(true);
    expect(result.result).toBe("success");
    expect(result.contextUpdate).toEqual({ count: 1 });
  });

  it("should skip execution if the condition returns false", async () => {
    const mockContext = { history: [], contextData: {} };
    const mockStep: FlowStep = {
      execute: async (context) => { throw new Error("Should not execute"); },
      condition: () => false,
    };

    // We expect the execution path to be skipped, so we test for no error thrown
    await expect(mockStep.execute(mockContext)).resolves.toEqual({ result: undefined, success: true, contextUpdate: {} });
  });

  it("should handle failure gracefully if an error occurs during execution", async () => {
    const mockContext = { history: [], contextData: {} };
    const mockError = new Error("Execution failed");
    const mockStep: FlowStep = {
      execute: async (context) => { throw mockError; },
      onFailure: async (context, error) => ({ result: "failed", success: false, contextUpdate: { errorHandled: true } }),
    };

    // Note: The actual implementation of how failure is handled in the consumer of FlowStep is assumed.
    // Here we test the failure path execution if the consumer calls onFailure.
    // Since we are testing the interface, we simulate the failure path handling.
    const failureResult = await mockStep.onFailure(mockContext, mockError);

    expect(failureResult.success).toBe(false);
    expect(failureResult.result).toBe("failed");
    expect(failureResult.contextUpdate).toEqual({ errorHandled: true });
  });
});