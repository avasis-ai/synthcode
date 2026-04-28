import { describe, it, expect } from "vitest";
import { SimpleValidationPipeline } from "../src/validation/tool-input-validation-pipeline-builder";

describe("SimpleValidationPipeline", () => {
    it("should initialize with no validators", () => {
        const pipeline = new SimpleValidationPipeline();
        // We can't directly access private members, but we can test its behavior
        // by checking if validation passes for empty data initially.
        const result = pipeline.validate({});
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should accumulate errors from multiple validators", () => {
        const pipeline = new SimpleValidationPipeline();
        const validator1: ValidatorStep = (data) => ({
            isValid: data.hasOwnProperty("fieldA") && data["fieldA"] !== null,
            errors: data["fieldA"] === null ? ["Field A is required."] : []
        });
        const validator2: ValidatorStep = (data) => ({
            isValid: typeof data.fieldB === 'number' && data.fieldB > 0,
            errors: typeof data.fieldB !== 'number' || data.fieldB <= 0 ? ["Field B must be a positive number."] : []
        });

        pipeline.addValidator(validator1);
        pipeline.addValidator(validator2);

        const dataWithErrors = { fieldA: null, fieldB: -5 };
        const result = pipeline.validate(dataWithErrors);

        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(expect.arrayContaining(["Field A is required.", "Field B must be a positive number."]));
        expect(result.errors.length).toBe(2);
    });

    it("should pass validation when all validators pass", () => {
        const pipeline = new SimpleValidationPipeline();
        const validator1: ValidatorStep = (data) => ({
            isValid: !!data.fieldA,
            errors: !data.fieldA ? ["Field A is required."] : []
        });
        const validator2: ValidatorStep = (data) => ({
            isValid: typeof data.fieldB === 'number' && data.fieldB > 0,
            errors: typeof data.fieldB !== 'number' || data.fieldB <= 0 ? ["Field B must be a positive number."] : []
        });

        pipeline.addValidator(validator1);
        pipeline.addValidator(validator2);

        const dataValid = { fieldA: "some value", fieldB: 10 };
        const result = pipeline.validate(dataValid);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });
});