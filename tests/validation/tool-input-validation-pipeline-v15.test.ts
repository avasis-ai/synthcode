import { describe, it, expect } from "vitest";
import { ToolInputValidationPipeline } from "../src/validation/tool-input-validation-pipeline-v15";

describe("ToolInputValidationPipeline", () => {
    it("should initialize correctly with an array of steps", async () => {
        const mockStep1: any = async (context: any, input: any) => ({ isValid: true, errors: [], context: {} });
        const mockStep2: any = async (context: any, input: any) => ({ isValid: true, errors: [], context: {} });
        const pipeline = new ToolInputValidationPipeline([mockStep1, mockStep2]);

        // We can't directly test private members, but we can test the execution flow
        // by running a simple validation.
        const result = await pipeline.validate(
            { context: { initial: "context" } },
            { input: { data: "input" } }
        );

        expect(result.isValid).toBe(true);
    });

    it("should execute all provided validation steps sequentially", async () => {
        const mockStep1 = vi.fn(async (context: any, input: any) => {
            if (context.initial === "fail_step1") {
                return { isValid: false, errors: ["Step 1 failed"], context: { ...context, step1_context: "fail" } };
            }
            return { isValid: true, errors: [], context: { ...context, step1_context: "ok" } };
        });
        const mockStep2 = vi.fn(async (context: any, input: any) => {
            if (context.step1_context === "fail") {
                return { isValid: false, errors: ["Step 2 skipped due to failure"], context: { ...context, step2_context: "skipped" } };
            }
            return { isValid: true, errors: [], context: { ...context, step2_context: "ok" } };
        });

        const pipeline = new ToolInputValidationPipeline([mockStep1, mockStep2]);

        // Test successful path
        await pipeline.validate(
            { context: { initial: "success" } },
            { input: { data: "valid_input" } }
        );
        expect(mockStep1).toHaveBeenCalledTimes(1);
        expect(mockStep2).toHaveBeenCalledTimes(1);

        // Test failure path (Step 1 fails, Step 2 should still run if designed to, but we test the flow)
        // Note: The actual pipeline implementation dictates if subsequent steps run on failure.
        // Assuming the pipeline runs all steps regardless of intermediate failure for this test structure.
        await pipeline.validate(
            { context: { initial: "fail_step1" } },
            { input: { data: "invalid_input" } }
        );
        expect(mockStep1).toHaveBeenCalledTimes(2); // Called again
        expect(mockStep2).toHaveBeenCalledTimes(2); // Called again
    });

    it("should return the aggregated result from the last step", async () => {
        const mockStep1 = vi.fn(async (context: any, input: any) => ({ isValid: true, errors: [], context: { ...context, step1_context: "ok" } }));
        const mockStep2 = vi.fn(async (context: any, input: any) => ({ isValid: false, errors: ["Final validation error"], context: { ...context, step2_context: "final_fail" } }));

        const pipeline = new ToolInputValidationPipeline([mockStep1, mockStep2]);

        const result = await pipeline.validate(
            { context: { initial: "test" } },
            { input: { data: "test_input" } }
        );

        // The result should reflect the outcome of the last step (mockStep2)
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(["Final validation error"]);
        expect(result.context).toHaveProperty("step2_context", "final_fail");
    });
});