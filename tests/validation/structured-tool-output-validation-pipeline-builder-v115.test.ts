import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineBuilderV115 } from "../src/validation/structured-tool-output-validation-pipeline-builder-v115";

describe("StructuredToolOutputValidationPipelineBuilderV115", () => {
    it("should initialize with empty validator lists", () => {
        const builder = new StructuredToolOutputValidationPipelineBuilderV115();
        expect(builder["temporalValidators"]).toEqual([]);
        expect(builder["crossFieldValidators"]).toEqual([]);
    });

    it("should allow adding temporal validators", () => {
        const builder = new StructuredToolOutputValidationPipelineBuilderV115();
        const validator1: () => boolean = () => true;
        const validator2: () => boolean = () => false;

        const result = builder.addTemporalValidatorStep(validator1);
        expect(result).toBe(builder);

        builder.addTemporalValidatorStep(validator2);
        expect(builder["temporalValidators"].length).toBe(2);
    });

    it("should allow adding cross-field validators", () => {
        const builder = new StructuredToolOutputValidationPipelineBuilderV115();
        const validator: (data: Record<string, unknown>) => boolean = (data) => data.hasOwnProperty("field");

        const result = builder.addCrossFieldValidatorStep(validator);
        expect(result).toBe(builder);

        expect(builder["crossFieldValidators"].length).toBe(1);
    });
});