import { describe, it, expect } from "vitest";
import { StructuredOutputValidationChain } from "../src/validation/structured-output-schema-validation-chain";

describe("StructuredOutputValidationChain", () => {
    it("should pass validation when all steps are valid", () => {
        const mockStep1: any = {
            validate: (payload: any) => ({ isValid: true, errors: [] }),
        };
        const mockStep2: any = {
            validate: (payload: any) => ({ isValid: true, errors: [] }),
        };
        const chain = new StructuredOutputValidationChain([mockStep1, mockStep2], true);
        const result = chain.validate({ key: "value" });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should fail validation and collect errors when one step fails", () => {
        const mockStep1: any = {
            validate: (payload: any) => ({ isValid: true, errors: [] }),
        };
        const mockStep2: any = {
            validate: (payload: any) => ({ isValid: false, errors: ["Error in step 2"] }),
        };
        const chain = new StructuredOutputValidationChain([mockStep1, mockStep2], false);
        const result = chain.validate({ key: "value" });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Error in step 2");
    });

    it("should report all failures when configured to do so", () => {
        const mockStep1: any = {
            validate: (payload: any) => ({ isValid: false, errors: ["Error in step 1"] }),
        };
        const mockStep2: any = {
            validate: (payload: any) => ({ isValid: false, errors: ["Error in step 2"] }),
        };
        const chain = new StructuredOutputValidationChain([mockStep1, mockStep2], true);
        const result = chain.validate({});
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors).toContain("Error in step 1");
        expect(result.errors).toContain("Error in step 2");
    });
});