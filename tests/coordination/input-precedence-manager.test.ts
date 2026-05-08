import { describe, it, expect } from "vitest";
import { InputPrecedenceManager, PrecedenceRule } from "../src/coordination/input-precedence-manager";

describe("InputPrecedenceManager", () => {
    it("should initialize correctly and check basic precedence rules", () => {
        const manager = new InputPrecedenceManager();
        const rule: PrecedenceRule = {
            id: "rule1",
            description: "A must precede B",
            requiredInputs: [
                { sourceId: "A", requiredType: "typeA", mustBePresent: true },
                { sourceId: "B", requiredType: "typeB", mustBePresent: true },
            ],
            requiredOrder: ["A", "B"],
        };
        manager.addRule(rule);

        // Simulate successful check
        const result = manager.checkPrecedence(rule.id, ["A", "B"]);
        expect(result).toBe(true);
    });

    it("should fail if required inputs are missing or out of order", () => {
        const manager = new InputPrecedenceManager();
        const rule: PrecedenceRule = {
            id: "rule2",
            description: "A must precede B",
            requiredInputs: [
                { sourceId: "A", requiredType: "typeA", mustBePresent: true },
                { sourceId: "B", requiredType: "typeB", mustBePresent: true },
            ],
            requiredOrder: ["A", "B"],
        };
        manager.addRule(rule);

        // Case 1: Missing input (B is missing)
        const resultMissing = manager.checkPrecedence(rule.id, ["A"]);
        expect(resultMissing).toBe(false);

        // Case 2: Incorrect order (B arrives before A)
        const resultOrder = manager.checkPrecedence(rule.id, ["B", "A"]);
        expect(resultOrder).toBe(false);
    });

    it("should pass if no order is required and all inputs are present", () => {
        const manager = new InputPrecedenceManager();
        const rule: PrecedenceRule = {
            id: "rule3",
            description: "A and B must be present",
            requiredInputs: [
                { sourceId: "A", requiredType: "typeA", mustBePresent: true },
                { sourceId: "B", requiredType: "typeB", mustBePresent: true },
            ],
            requiredOrder: undefined,
        };
        manager.addRule(rule);

        // Inputs are present, and no order is enforced
        const result = manager.checkPrecedence(rule.id, ["B", "A"]);
        expect(result).toBe(true);
    });
});