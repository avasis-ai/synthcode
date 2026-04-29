import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineBuilder } from "../src/validation/structured-tool-output-validation-pipeline-builder-v117";

describe("StructuredToolOutputValidationPipelineBuilder", () => {
    it("should build a pipeline with a single validator", () => {
        const builder = new StructuredToolOutputValidationPipelineBuilder();
        const validator = (data: Record<string, unknown>) => ({ isValid: true, errors: [] });
        const pipeline = builder.addValidator(validator).build();

        expect(typeof pipeline.validate).toBe("function");
        const result = pipeline.validate({ test: "data" });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should build a pipeline with multiple validators", () => {
        const builder = new StructuredToolOutputValidationPipelineBuilder();
        const validator1 = (data: Record<string, unknown>) => ({ isValid: true, errors: [] });
        const validator2 = (data: Record<string, unknown>) => ({ isValid: true, errors: [] });
        const pipeline = builder.addValidator(validator1).addValidator(validator2).build();

        expect(typeof pipeline.validate).toBe("function");
        const result = pipeline.validate({ test: "data" });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should aggregate errors from multiple validators", () => {
        const builder = new StructuredToolOutputValidationPipelineBuilder();
        const validator1 = (data: Record<string, unknown>) => ({ isValid: false, errors: ["Error 1"] });
        const validator2 = (data: Record<string, unknown>) => ({ isValid: false, errors: ["Error 2"] });
        const pipeline = builder.addValidator(validator1).addValidator(validator2).build();

        const result = pipeline.validate({ test: "data" });
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(["Error 1", "Error 2"]);
    });
});