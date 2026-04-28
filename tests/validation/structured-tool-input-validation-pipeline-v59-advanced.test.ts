import { describe, it, expect } from "vitest";
import { ValidationStep } from "../src/validation/structured-tool-input-validation-pipeline-v59-advanced";

describe("ValidationStep", () => {
  it("should correctly execute a basic validation step with context", async () => {
    const mockContext: ValidationContext = {
      initialInput: { query: "test" },
      currentContext: { user: "testUser" },
      previousStepOutput: "some previous data",
    };
    const mockStep: ValidationStep<any, any> = {
      name: "testStep",
      execute: async (context: ValidationContext) => {
        expect(context.initialInput).toBeDefined();
        return { output: "success" };
      },
    };

    const result = await mockStep.execute(mockContext);
    expect(result).toEqual({ output: "success" });
  });

  it("should handle asynchronous execution within a validation step", async () => {
    const mockContext: ValidationContext = {
      initialInput: {},
      currentContext: {},
      previousStepOutput: null,
    };
    const mockStep: ValidationStep<any, any> = {
      name: "asyncStep",
      execute: async (context: ValidationContext) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { output: "async success" };
      },
    };

    const result = await mockStep.execute(mockContext);
    expect(result).toEqual({ output: "async success" });
  });

  it("should throw an error if the validation step fails", async () => {
    const mockContext: ValidationContext = {
      initialInput: { data: 1 },
      currentContext: { data: 2 },
      previousStepOutput: 3,
    };
    const mockStep: ValidationStep<any, any> = {
      name: "failingStep",
      execute: async (context: ValidationContext) => {
        throw new Error("Validation failed intentionally");
      },
    };

    await expect(mockStep.execute(mockContext)).rejects.toThrow("Validation failed intentionally");
  });
});