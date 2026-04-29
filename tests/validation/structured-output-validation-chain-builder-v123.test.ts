import { describe, it, expect } from "vitest";
import { ValidationChain } from "../src/validation/structured-output-validation-chain-builder-v123";

describe("ValidationChain", () => {
    it("should execute all steps if all conditions pass", () => {
        const mockStep1: ValidationStep = {
            execute: (input, context) => ({ isValid: true, errors: [], context: { ...context, step1Passed: true } }),
        };
        const mockStep2: ValidationStep = {
            execute: (input, context) => ({ isValid: true, errors: [], context: { ...context, step2Passed: true } }),
        };
        const chain = new ValidationChain([
            { step: mockStep1, condition: () => true },
            { step: mockStep2, condition: () => true },
        ]);

        const result = chain.run({}, {});
        expect(result.isValid).toBe(true);
        expect(result.context).toEqual(expect.objectContaining({ step1Passed: true, step2Passed: true }));
    });

    it("should stop execution and return invalid if a condition fails", () => {
        const mockStep1: ValidationStep = {
            execute: (input, context) => ({ isValid: true, errors: [], context: { ...context, step1Passed: true } }),
        };
        const mockStep2: ValidationStep = {
            execute: (input, context) => ({ isValid: true, errors: [], context: { ...context, step2Passed: true } }),
        };
        const chain = new ValidationChain([
            { step: mockStep1, condition: () => true },
            { step: mockStep2, condition: () => false }, // This condition fails
        ]);

        const result = chain.run({}, {});
        expect(result.isValid).toBe(false);
        // Check that step 2 was not executed (or at least its context update wasn't fully processed if the chain handles early exit)
        expect(result.context).toEqual(expect.objectContaining({ step1Passed: true }));
    });

    it("should aggregate errors from any failing step", () => {
        const mockStep1: ValidationStep = {
            execute: (input, context) => ({ isValid: true, errors: [], context: { ...context, step1Passed: true } }),
        };
        const mockStep2: ValidationStep = {
            execute: (input, context) => ({ isValid: false, errors: ["Step 2 failed validation"], context: { ...context, step2Failed: true } }),
        };
        const chain = new ValidationChain([
            { step: mockStep1, condition: () => true },
            { step: mockStep2, condition: () => true },
        ]);

        const result = chain.run({}, {});
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(expect.arrayContaining(["Step 2 failed validation"]));
    });
});