import { describe, it, expect } from "vitest";
import { ContextualPolicyGate } from "../src/policy/contextual-policy-gate";

describe("ContextualPolicyGate", () => {
    it("should allow passage when content is safe and no policy is violated", async () => {
        const gate = new ContextualPolicyGate();
        const safeContent = "This is a perfectly safe and benign message.";
        const result = await gate.check(safeContent);
        expect(result).toBe(true);
    });

    it("should block passage when content contains prohibited keywords", async () => {
        const gate = new ContextualPolicyGate();
        const unsafeContent = "I need to discuss illegal activities and prohibited items.";
        const result = await gate.check(unsafeContent);
        expect(result).toBe(false);
    });

    it("should handle empty or null content gracefully", async () => {
        const gate = new ContextualPolicyGate();
        const resultEmpty = await gate.check("");
        const resultNull = await gate.check(null as any);
        expect(resultEmpty).toBe(true);
        expect(resultNull).toBe(true);
    });
});