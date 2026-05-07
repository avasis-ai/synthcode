import { describe, it, expect } from "vitest";
import { ResourceConstraintValidator, ResourceConstraintPayload } from "../src/validation/resource-constraint-validator";

describe("ResourceConstraintValidator", () => {
    it("should validate resource usage against defined constraints and return violation messages", () => {
        const validator = new ResourceConstraintValidator();
        const payload: ResourceConstraintPayload = {
            maxCost: 100,
            maxTimeSeconds: 300,
            maxQuota: 50,
        };

        // Simulate usage exceeding cost and quota, but within time limit
        const usage = {
            cost: 150,
            timeSeconds: 250,
            quota: 60,
        };

        const violations = validator.validate(usage, payload);

        expect(violations).toHaveLength(2);
        expect(violations).toContainEqual(
            expect.objectContaining({
                constraint: "cost",
                actualUsage: 150,
                limit: 100,
                message: expect.stringContaining("cost exceeded")
            })
        );
        expect(violations).toContainEqual(
            expect.objectContaining({
                constraint: "quota",
                actualUsage: 60,
                limit: 50,
                message: expect.stringContaining("quota exceeded")
            })
        );
    });

    it("should return an empty array when all resource usages are within limits", () => {
        const validator = new ResourceConstraintValidator();
        const payload: ResourceConstraintPayload = {
            maxCost: 500,
            maxTimeSeconds: 600,
            maxQuota: 100,
        };

        // Simulate usage well within limits
        const usage = {
            cost: 499,
            timeSeconds: 599,
            quota: 99,
        };

        const violations = validator.validate(usage, payload);
        expect(violations).toEqual([]);
    });

    it("should handle zero or negative limits correctly, flagging violations if usage is positive", () => {
        const validator = new ResourceConstraintValidator();
        const payload: ResourceConstraintPayload = {
            maxCost: 0,
            maxTimeSeconds: 0,
            maxQuota: 0,
        };

        // Simulate usage that exceeds zero limits
        const usage = {
            cost: 1,
            timeSeconds: 1,
            quota: 1,
        };

        const violations = validator.validate(usage, payload);
        expect(violations).toHaveLength(3);
        expect(violations.every(v => v.actualUsage > v.limit)).toBe(true);
    });
});