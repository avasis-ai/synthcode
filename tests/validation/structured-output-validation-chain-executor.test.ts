import { describe, it, expect } from "vitest";
import { StructuredOutputValidationChainExecutor } from "../src/validation/structured-output-validation-chain-executor";

describe("StructuredOutputValidationChainExecutor", () => {
  it("should execute validation steps sequentially and aggregate errors", async () => {
    const mockStep1: any = async (input) => ({
      result: { data: "step1_output", processed: true },
      errors: [],
    });
    const mockStep2: any = async (input) => ({
      result: { final: "step2_output" },
      errors: [{ stepName: "step2", field: "final", message: "Error in step 2" }],
    });

    const executor = new StructuredOutputValidationChainExecutor([mockStep1, mockStep2]);
    const result = await executor.execute({});

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].stepName).toBe("step2");
  });

  it("should return valid result if all steps pass", async () => {
    const mockStep1: any = async (input) => ({
      result: { data: "step1_output" },
      errors: [],
    });
    const mockStep2: any = async (input) => ({
      result: { final: "step2_output" },
      errors: [],
    });

    const executor = new StructuredOutputValidationChainExecutor([mockStep1, mockStep2]);
    const result = await executor.execute({});

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should pass the result of one step as input to the next step", async () => {
    let lastInput: Record<string, unknown> = {};
    const mockStep1: any = async (input) => {
      lastInput = input;
      return { result: { intermediate: "step1" }, errors: [] };
    };
    const mockStep2: any = async (input) => {
      // Should receive the result from step 1
      expect(input).toEqual({ intermediate: "step1" });
      return { result: { final: "step2" }, errors: [] };
    };

    const executor = new StructuredOutputValidationChainExecutor([mockStep1, mockStep2]);
    await executor.execute({});
  });
});