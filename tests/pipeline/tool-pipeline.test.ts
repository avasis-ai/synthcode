import { describe, it, expect } from "vitest";
import { ToolPipeline } from "../src/pipeline/tool-pipeline";

describe("ToolPipeline", () => {
  it("should execute all steps sequentially with correct context passing", async () => {
    const mockStep1: any = {
      execute: async (inputContext: any) => {
        expect(inputContext).toBe("initial");
        return { data: "step1_output" };
      },
    };
    const mockStep2: any = {
      execute: async (inputContext: any) => {
        expect(inputContext).toEqual({ data: "step1_output" });
        return { final: "step2_output" };
      },
    };

    const pipeline = new ToolPipeline([
      { step: mockStep1, name: "step1" },
      { step: mockStep2, name: "step2" },
    ]);

    const result = await pipeline.execute("initial");
    expect(result).toEqual({ final: "step2_output" });
  });

  it("should handle an empty pipeline without error", async () => {
    const pipeline = new ToolPipeline([]);
    const result = await pipeline.execute("any_input");
    // Assuming TOutput for an empty pipeline might default or be undefined based on implementation,
    // but for testing the structure, we check if it completes without error.
    // If the class implementation guarantees a return type, we'd assert against that.
    // Based on the provided snippet, it seems to return the last step's output.
    // For an empty pipeline, we'll assume it returns null or undefined if TOutput allows it.
    // Since we can't see the full return type handling, we check for successful execution.
    expect(result).toBeUndefined(); // Adjust this assertion if the expected return for empty pipeline is different
  });

  it("should pass the initial context to the first step", async () => {
    const initialContext = { user: "test_user" };
    const mockStep: any = {
      execute: async (inputContext: any) => {
        expect(inputContext).toEqual(initialContext);
        return "success";
      },
    };

    const pipeline = new ToolPipeline([
      { step: mockStep, name: "first_step" },
    ]);

    const result = await pipeline.execute(initialContext);
    expect(result).toBe("success");
  });
});