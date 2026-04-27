import { describe, it, expect } from "vitest";
import { ToolOutputPipeline } from "../src/validation/tool-output-pipeline";

describe("ToolOutputPipeline", () => {
    it("should run all steps sequentially and return the final output", async () => {
        const mockStep1: any = async (input: any) => ({ output: "step1_output", errors: [] });
        const mockStep2: any = async (input: any) => ({ output: "step2_output", errors: [] });

        const pipeline = new ToolOutputPipeline([
            { step: mockStep1, name: "Step 1" },
            { step: mockStep2, name: "Step 2" },
        ]);

        const result = await pipeline.run("initial_input");

        expect(result.output).toBe("step2_output");
    });

    it("should stop and return errors if any step fails", async () => {
        const mockStep1: any = async (input: any) => ({ output: "ok", errors: [] });
        const mockStep2: any = async (input: any) => ({ output: undefined, errors: ["Error in Step 2"] });
        const mockStep3: any = async (input: any) => ({ output: "should_not_reach", errors: [] });

        const pipeline = new ToolOutputPipeline([
            { step: mockStep1, name: "Step 1" },
            { step: mockStep2, name: "Step 2" },
            { step: mockStep3, name: "Step 3" },
        ]);

        const result = await pipeline.run("initial_input");

        expect(result.output).toBeUndefined(); // Assuming the return type handles failure gracefully, or the last successful output if the implementation dictates.
        expect(result.errors).toEqual(["Error in Step 2"]);
    });

    it("should handle an empty pipeline gracefully", async () => {
        const pipeline = new ToolOutputPipeline([]);

        const result = await pipeline.run("any_input");

        expect(result.output).toBeNull(); // Or whatever the expected initial state/default output is for an empty pipeline.
        expect(result.errors).toEqual([]);
    });
});