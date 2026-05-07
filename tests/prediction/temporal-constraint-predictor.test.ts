import { describe, it, expect } from "vitest";
import { TemporalConstraintPredictor } from "../src/prediction/temporal-constraint-predictor";

describe("TemporalConstraintPredictor", () => {
    it("should predict conflicts when resource limits are exceeded", () => {
        const predictor = new TemporalConstraintPredictor({
            resourceLimits: { cpu: 1, memory: 100 }
        });

        const existingActions = [
            { name: "ActionA", startTime: 0, duration: 10, resources: { cpu: 1, memory: 50 } },
            { name: "ActionB", startTime: 5, duration: 10, resources: { cpu: 1, memory: 60 } }
        ];

        const predictedAction = { name: "ActionC", startTime: 0, duration: 10, resources: { cpu: 2, memory: 120 } };

        const report = predictor.predict(existingActions, [predictedAction]);

        expect(report.conflicts).toHaveLength(2);
        expect(report.conflicts[0].resource).toBe("cpu");
        expect(report.conflicts[0].exceededLimit).toBe(1);
        expect(report.conflicts[1].resource).toBe("memory");
        expect(report.conflicts[1].exceededLimit).toBe(100);
    });

    it("should predict no conflicts when resources are within limits", () => {
        const predictor = new TemporalConstraintPredictor({
            resourceLimits: { cpu: 2, memory: 200 }
        });

        const existingActions = [
            { name: "ActionA", startTime: 0, duration: 10, resources: { cpu: 1, memory: 50 } },
            { name: "ActionB", startTime: 5, duration: 10, resources: { cpu: 1, memory: 100 } }
        ];

        const predictedAction = { name: "ActionC", startTime: 0, duration: 10, resources: { cpu: 1, memory: 10 } };

        const report = predictor.predict(existingActions, [predictedAction]);

        expect(report.conflicts).toHaveLength(0);
        expect(report.summary).toContain("No conflicts detected");
    });

    it("should handle empty existing actions list", () => {
        const predictor = new TemporalConstraintPredictor({
            resourceLimits: { cpu: 1, memory: 100 }
        });

        const existingActions: any[] = [];
        const predictedAction = { name: "ActionC", startTime: 0, duration: 10, resources: { cpu: 1, memory: 10 } };

        const report = predictor.predict(existingActions, [predictedAction]);

        expect(report.conflicts).toHaveLength(0);
        expect(report.summary).toContain("No conflicts detected");
    });
});