import { describe, it, expect } from "vitest";
import { ToolOutputValidationChain } from "../src/validation/tool-output-validation-chain";

describe("ToolOutputValidationChain", () => {
  it("should execute all steps sequentially with correct input/output passing", async () => {
    const mockStep1: any = {
      input: "initial",
      step: {
        execute: async (input: any) => {
          expect(input).toBe("initial");
          return { data: "step1_output", nextInput: "step1_output" };
        },
      },
    };
    const mockStep2: any = {
      input: "step1_output",
      step: {
        execute: async (input: any) => {
          expect(input).toEqual({ data: "step1_output", nextInput: "step1_output" });
          return { finalResult: "success" };
        },
      },
    };

    const chain = new ToolOutputValidationChain(
      [mockStep1, mockStep2],
      "initial"
    );

    const result = await chain.execute();

    expect(result).toEqual({ finalResult: "success" });
  });

  it("should handle an empty chain gracefully", async () => {
    const chain = new ToolOutputValidationChain([], "initial");

    const result = await chain.execute();

    // Assuming the chain returns the initial input or a defined default if no steps run
    // Based on the structure, if no steps run, it might return the initial input or throw if execution logic requires at least one step.
    // For testing purposes, we assume it returns the initial input if no steps are defined.
    expect(result).toBe("initial");
  });

  it("should throw an error if any step execution fails", async () => {
    const mockStep1: any = {
      input: "initial",
      step: {
        execute: async (input: any) => {
          if (input !== "initial") {
            throw new Error("Invalid input for step 1");
          }
          return { data: "step1_output", nextInput: "step1_output" };
        },
      },
    };
    const mockStep2: any = {
      input: "step1_output",
      step: {
        execute: async (input: any) => {
          // This step expects the output of step 1, but we force it to fail if it receives something else
          throw new Error("Step 2 failed intentionally");
        },
      },
    };

    const chain = new ToolOutputValidationChain(
      [mockStep1, mockStep2],
      "initial"
    );

    await expect(chain.execute()).rejects.toThrow("Step 2 failed intentionally");
  });
});