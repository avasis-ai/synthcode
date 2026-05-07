import { describe, it, expect } from "vitest";
import { ContextualPreflightValidator } from "../src/validation/contextual-preflight-validator";

describe("ContextualPreflightValidator", () => {
    it("should successfully run multiple checks and return success", () => {
        const mockContext: Context = {
            history: [],
            state: { user: "test" },
        };

        const check1: PreflightCheck = (context, proposal) => ({
            isSuccess: true,
            isWarning: false,
            message: "Check 1 passed.",
            details: {},
        });

        const check2: PreflightCheck = (context, proposal) => ({
            isSuccess: true,
            isWarning: false,
            message: "Check 2 passed.",
            details: {},
        });

        const validator = new ContextualPreflightValidator([check1, check2]);
        const result = validator.validate(mockContext, { data: "test" });

        expect(result.isSuccess).toBe(true);
        expect(result.isWarning).toBe(false);
        expect(result.message).toContain("Check 2 passed.");
    });

    it("should fail validation if any check returns failure", () => {
        const mockContext: Context = {
            history: [],
            state: {},
        };

        const failingCheck: PreflightCheck = (context, proposal) => ({
            isSuccess: false,
            isWarning: false,
            message: "Validation failed due to missing data.",
            details: { field: "data" },
        });

        const validator = new ContextualPreflightValidator([failingCheck]);
        const result = validator.validate(mockContext, { data: null });

        expect(result.isSuccess).toBe(false);
        expect(result.message).toContain("Validation failed");
    });

    it("should report warning if any check returns warning", () => {
        const mockContext: Context = {
            history: [],
            state: { user: "test" },
        };

        const warningCheck: PreflightCheck = (context, proposal) => ({
            isSuccess: true,
            isWarning: true,
            message: "Warning: Data might be stale.",
            details: { severity: "low" },
        });

        const passingCheck: PreflightCheck = (context, proposal) => ({
            isSuccess: true,
            isWarning: false,
            message: "Check passed.",
            details: {},
        });

        const validator = new ContextualPreflightValidator([passingCheck, warningCheck]);
        const result = validator.validate(mockContext, { data: "test" });

        expect(result.isSuccess).toBe(true);
        expect(result.isWarning).toBe(true);
        expect(result.message).toContain("Warning: Data might be stale.");
    });
});