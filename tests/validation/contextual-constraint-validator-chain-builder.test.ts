import { describe, it, expect } from "vitest";
import { ConstraintChainBuilder } from "../src/validation/contextual-constraint-validator-chain-builder";

describe("ConstraintChainBuilder", () => {
    it("should build a chain from a single validator", () => {
        const validator = {
            validate: (context) => ({ isValid: true }),
        } as any;
        const builder = new ConstraintChainBuilder();
        const chain = builder.addValidator(validator);

        const context = { payload: {}, history: [] };
        const result = chain.execute(context);
        expect(result.isValid).toBe(true);
    });

    it("should build a chain from multiple validators", () => {
        const validator1 = {
            validate: (context) => ({ isValid: true }),
        } as any;
        const validator2 = {
            validate: (context) => ({ isValid: true }),
        } as any;
        const builder = new ConstraintChainBuilder();
        const chain = builder.addValidator(validator1).addValidator(validator2);

        const context = { payload: {}, history: [] };
        const result = chain.execute(context);
        expect(result.isValid).toBe(true);
    });

    it("should stop and return failure immediately if any validator fails", () => {
        const failingValidator = {
            validate: (context) => ({ isValid: false, message: "Validation failed" }),
        } as any;
        const passingValidator = {
            validate: (context) => ({ isValid: true }),
        } as any;
        const builder = new ConstraintChainBuilder();
        const chain = builder.addValidator(passingValidator).addValidator(failingValidator);

        const context = { payload: {}, history: [] };
        const result = chain.execute(context);
        expect(result.isValid).toBe(false);
        expect(result.message).toBe("Validation failed");
    });
});