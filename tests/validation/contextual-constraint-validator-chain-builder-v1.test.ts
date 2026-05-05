import { describe, it, expect } from "vitest";
import { ContextualConstraintValidatorChainBuilder } from "../src/validation/contextual-constraint-validator-chain-builder-v1";

describe("ContextualConstraintValidatorChainBuilder", () => {
    it("should initialize with no validators", () => {
        const builder = new ContextualConstraintValidatorChainBuilder();
        // We can't directly access private members, but we can test the buildChain behavior
        // which relies on the internal state. A simple check on the return type/structure is enough.
        const chain = builder.buildChain();
        expect(typeof chain).toBe("function");
    });

    it("should build a chain that executes added validators sequentially", () => {
        const builder = new ContextualConstraintValidatorChainBuilder();
        const context: Record<string, unknown> = { userRole: "admin" };

        const validator1: ValidatorFactory = (context) => (payload) => {
            if (context.userRole === "admin") return true;
            return false;
        };

        const validator2: ValidatorFactory = (context) => (payload) => {
            return typeof payload === "string" && payload.length > 0;
        };

        builder.addValidator(validator1);
        builder.addValidator(validator2);

        const chain = builder.buildChain();
        const result = chain(context, "test payload");

        expect(result).toBe(true);
    });

    it("should stop and return false immediately if any validator fails", () => {
        const builder = new ContextualConstraintValidatorChainBuilder();
        const context: Record<string, unknown> = { userRole: "guest" };

        const failingValidator: ValidatorFactory = (context) => (payload) => {
            return context.userRole === "admin"; // Fails for "guest"
        };

        const succeedingValidator: ValidatorFactory = (context) => (payload) => {
            return true; // Should not be reached
        };

        builder.addValidator(failingValidator);
        builder.addValidator(succeedingValidator);

        const chain = builder.buildChain();
        const result = chain(context, "some payload");

        expect(result).toBe(false);
    });
});