import { describe, it, expect } from "vitest";
import { DynamicConstraintNegotiator } from "../src/negotiation/dynamic-constraint-negotiator";

describe("DynamicConstraintNegotiator", () => {
    it("should accept a proposal when constraints are highly compatible", async () => {
        const negotiator = new DynamicConstraintNegotiator();
        const proposal = {
            proposedConstraints: [
                { key: "A", value: 1, weight: 0.8, description: "Constraint A" },
                { key: "B", value: 2, weight: 0.7, description: "Constraint B" },
            ],
            priorityRationale: "A and B are critical and complement each other.",
        };
        const report = await negotiator.negotiate(proposal);
        expect(report.isFeasible).toBe(true);
        expect(report.acceptedConstraints).toHaveLength(2);
    });

    it("should reject a proposal when constraints conflict significantly", async () => {
        const negotiator = new DynamicConstraintNegotiator();
        const proposal = {
            proposedConstraints: [
                { key: "X", value: "High", weight: 0.9, description: "Constraint X (High)" },
                { key: "Y", value: "Low", weight: 0.9, description: "Constraint Y (Low)" },
            ],
            priorityRationale: "We need both X and Y, but they might conflict.",
        };
        const report = await negotiator.negotiate(proposal);
        expect(report.isFeasible).toBe(false);
        expect(report.rejectionReason).toContain("conflict");
        expect(report.acceptedConstraints).toHaveLength(0);
    });

    it("should accept a proposal when constraints are redundant but necessary", async () => {
        const negotiator = new DynamicConstraintNegotiator();
        const proposal = {
            proposedConstraints: [
                { key: "Z", value: 5, weight: 0.6, description: "Constraint Z (Primary)" },
                { key: "Z", value: 5, weight: 0.4, description: "Constraint Z (Secondary)" },
            ],
            priorityRationale: "Both constraints enforce the same value, ensuring robustness.",
        };
        const report = await negotiator.negotiate(proposal);
        expect(report.isFeasible).toBe(true);
        expect(report.acceptedConstraints).toHaveLength(1);
    });
});