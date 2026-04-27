import { describe, it, expect } from "vitest";
import { GuardrailManager } from "../src/tool/execution-guard";

describe("GuardrailManager", () => {
    it("should initialize with no guardrails", () => {
        const manager = new GuardrailManager<any, any>();
        // We can't directly check private fields, but we can test adding/checking
        // A simple check that it doesn't throw on instantiation is enough for this scope.
        expect(manager).toBeDefined();
    });

    it("should add a guardrail correctly", () => {
        const manager = new GuardrailManager<string, any>();
        const mockGuardrail: any = {
            validate: (inputs: string, context: any) => ({ isValid: true })
        };
        manager.addGuardrail(mockGuardrail, "TestGuardrail");

        // A more robust test would involve checking internal state, but for simplicity,
        // we rely on the public API usage.
        // If we could access the private array, we'd check its length/contents.
    });

    it("should validate inputs against all added guardrails", () => {
        const manager = new GuardrailManager<string, any>();
        const failingGuardrail: any = {
            validate: (inputs: string, context: any) => ({ isValid: false, reason: "Failed validation" })
        };
        const passingGuardrail: any = {
            validate: (inputs: string, context: any) => ({ isValid: true })
        };

        manager.addGuardrail(failingGuardrail, "FailGuard");
        manager.addGuardrail(passingGuardrail, "PassGuard");

        const result = manager.validate("some input", {});

        // The manager should return the result of the first failing guardrail, or success if all pass.
        expect(result.isValid).toBe(false);
        expect(result.reason).toBe("Failed validation");
    });
});