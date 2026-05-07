import { describe, it, expect } from "vitest";
import { PlanConflictPredictor } from "../src/planning/plan-conflict-predictor";
import { Plan, GlobalConstraints, PlanStep, Conflict, Correction } from "../src/planning/types";

describe("PlanConflictPredictor", () => {
    it("should predict no conflict for a feasible plan", () => {
        const constraints: GlobalConstraints = {
            initialResources: { "A": 10, "B": 10 },
            maxTime: 100,
            resourceConsumptionRate: { "A": 1, "B": 1 }
        };

        const plan: Plan = [
            { step: { action: "Move", duration: 5, resources: {} } },
            { step: { action: "Wait", duration: 10, resources: {} } },
            { step: { action: "UseResource", duration: 5, resources: { "A": 2 } } }
        ];

        const predictor = new PlanConflictPredictor(constraints);
        const result = predictor.predict(plan);

        expect(result.feasible).toBe(true);
        expect(result.conflict).toBeUndefined();
        expect(result.revisedPlan).toBeUndefined();
    });

    it("should predict a conflict when resources are overconsumed", () => {
        const constraints: GlobalConstraints = {
            initialResources: { "A": 5 },
            maxTime: 50,
            resourceConsumptionRate: { "A": 1 }
        };

        const plan: Plan = [
            { step: { action: "UseResource", duration: 3, resources: { "A": 3 } } },
            { step: { action: "UseResource", duration: 4, resources: { "A": 3 } } } // Total A needed: 6 > 5
        ];

        const predictor = new PlanConflictPredictor(constraints);
        const result = predictor.predict(plan);

        expect(result.feasible).toBe(false);
        expect(result.conflict).toBeDefined();
        expect(result.conflict?.reason).toContain("Resource A");
    });

    it("should suggest corrections when a conflict is detected", () => {
        const constraints: GlobalConstraints = {
            initialResources: { "A": 5 },
            maxTime: 50,
            resourceConsumptionRate: { "A": 1 }
        };

        const plan: Plan = [
            { step: { action: "UseResource", duration: 3, resources: { "A": 3 } } },
            { step: { action: "UseResource", duration: 4, resources: { "A": 3 } } }
        ];

        const predictor = new PlanConflictPredictor(constraints);
        const result = predictor.predict(plan);

        expect(result.feasible).toBe(false);
        expect(result.conflict).toBeDefined();
        expect(result.corrections).toBeDefined();
        expect(result.corrections!.length).toBeGreaterThan(0);
    });
});