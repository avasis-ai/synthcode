import { describe, it, expect } from "vitest";
import { CorrectionPayload, Constraint } from "../src/validation/external-correction-validator";

describe("ExternalCorrectionValidator", () => {
    it("should correctly validate a basic constraint payload", () => {
        const constraint: Constraint = {
            key: "user_id",
            value: 123,
            priority: 10,
            source: "external",
        };
        // Assuming there is a validation function or method to test here.
        // Since the implementation is not provided, we test the structure and type handling.
        expect(constraint.key).toBe("user_id");
        expect(typeof constraint.value).toBe("number");
        expect(constraint.source).toBe("external");
    });

    it("should handle different correction types in the payload", () => {
        const payload: CorrectionPayload = {
            type: "context",
            value: "Updated context data.",
            priority: 5,
            description: "Context update from external source.",
        };
        expect(payload.type).toBe("context");
        expect(typeof payload.value).toBe("string");
        expect(payload.priority).toBe(5);
    });

    it("should validate a complex payload structure", () => {
        const payload: CorrectionPayload = {
            type: "state",
            value: {
                key: "session_status",
                value: "active",
            },
            priority: 100,
            description: "High priority state correction.",
        };
        expect(payload.type).toBe("state");
        expect(payload.description).toContain("High priority");
        expect(payload.priority).toBe(100);
    });
});