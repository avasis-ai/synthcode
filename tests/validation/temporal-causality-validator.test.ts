import { describe, it, expect } from "vitest";
import { TemporalCausalityValidator, PlanStep } from "../src/validation/temporal-causality-validator";

describe("TemporalCausalityValidator", () => {
    it("should validate a simple linear causality chain correctly", () => {
        const validator = new TemporalCausalityValidator();
        const steps: PlanStep[] = [
            { id: "A", timestamp: new Date("2023-01-01T10:00:00Z"), action: {} },
            { id: "B", timestamp: new Date("2023-01-01T10:05:00Z"), action: {} },
            { id: "C", timestamp: new Date("2023-01-01T10:10:00Z"), action: {} },
        ];
        // Assuming the validator checks if B depends on A, and C depends on B
        // Since the actual implementation details of the validator are not fully provided,
        // we simulate a successful validation scenario for a well-ordered plan.
        const result = validator.validatePlan(steps, [
            { requiredPredecessorId: "A", timeWindow: "1h", expectedEffect: "B" },
            { requiredPredecessorId: "B", timeWindow: "1h", expectedEffect: "C" },
        ]);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it("should fail validation if a step violates the time window constraint", () => {
        const validator = new TemporalCausalityValidator();
        const steps: PlanStep[] = [
            { id: "A", timestamp: new Date("2023-01-01T10:00:00Z"), action: {} },
            // B happens too late (more than 1 hour after A)
            { id: "B", timestamp: new Date("2023-01-01T12:00:00Z"), action: {} },
        ];
        // Rule: B must happen within 1 hour of A
        const rules = [
            { requiredPredecessorId: "A", timeWindow: "1h", expectedEffect: "B" },
        ];
        const result = validator.validatePlan(steps, rules);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Step B violates the time window constraint relative to A.");
    });

    it("should fail validation if a required predecessor step is missing", () => {
        const validator = new TemporalCausalityValidator();
        const steps: PlanStep[] = [
            // Step B requires A, but A is missing
            { id: "B", timestamp: new Date("2023-01-01T10:05:00Z"), action: {} },
        ];
        // Rule: B must depend on A
        const rules = [
            { requiredPredecessorId: "A", timeWindow: "1h", expectedEffect: "B" },
        ];
        const result = validator.validatePlan(steps, rules);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Required predecessor step 'A' for step 'B' is missing.");
    });
});