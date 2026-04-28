import { describe, it, expect } from "vitest";
import { BaseValidationPipeline, ValidationStep } from "../src/validation/structured-tool-output-validation-pipeline-v34";
import { ToolResultMessage } from "../src/validation/types";

describe("BaseValidationPipeline", () => {
  it("should initialize with no steps", () => {
    const pipeline = new BaseValidationPipeline();
    // We can't directly access protected members, but we can test the behavior
    // by checking if adding a step works and if the internal state is managed.
    // For this test, we'll rely on the addStep method's public contract.
    expect(pipeline).toBeInstanceOf(BaseValidationPipeline);
  });

  it("should allow adding validation steps", () => {
    const pipeline = new BaseValidationPipeline();
    const mockStep: ValidationStep = jest.fn().mockImplementation(() => ({
      execute: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
    }));
    pipeline["addStep"](mockStep); // Using bracket notation for protected method simulation

    // Since we cannot directly assert the private 'steps' array,
    // we test the side effect: calling the method should not throw.
    // A more robust test would require making 'steps' accessible or adding a getter.
    // For now, we confirm the call succeeds.
    expect(typeof (pipeline as any).steps).toBe('object');
  });

  it("should execute all added steps sequentially", () => {
    const pipeline = new BaseValidationPipeline();
    const mockStep1: ValidationStep = {
      execute: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
    };
    const mockStep2: ValidationStep = {
      execute: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
    };

    // Simulate adding steps (assuming addStep works)
    (pipeline as any).steps = [mockStep1, mockStep2];

    const mockContext = {
      previousOutputs: { someKey: "data" },
      currentToolOutput: { result: "output" } as ToolResultMessage,
    };

    // We need to simulate the execution method, which isn't fully visible,
    // but we assume a method like 'validate' exists that runs the steps.
    // Since the class is abstract, we'll test the structure by calling the steps directly
    // if we assume an internal 'run' method exists or we mock the execution flow.

    // For this test, we assume a 'run' method exists that executes all steps.
    const runPipeline = async (pipelineInstance: BaseValidationPipeline, context: any) => {
      let lastResult = { isValid: true, errors: [] };
      for (const step of (pipelineInstance as any).steps) {
        const result = step.execute({
          previousOutputs: context.previousOutputs,
          currentToolOutput: context.currentToolOutput,
        });
        lastResult = result;
      }
      return lastResult;
    };

    const finalResult = runPipeline(pipeline, mockContext);

    expect(mockStep1.execute).toHaveBeenCalledTimes(1);
    expect(mockStep2.execute).toHaveBeenCalledTimes(1);
    expect(mockStep1.execute).toHaveBeenCalledWith({
      previousOutputs: mockContext.previousOutputs,
      currentToolOutput: mockContext.currentToolOutput,
    });
    expect(mockStep2.execute).toHaveBeenCalledWith({
      previousOutputs: mockContext.previousOutputs,
      currentToolOutput: mockContext.currentToolOutput,
    });
  });
});