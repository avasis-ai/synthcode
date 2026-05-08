import { describe, it, expect } from "vitest";
import {
    ResourceAllocationPolicyEngine,
    ResourceConstraints,
    ResourceUsage,
    PlanStep,
} from "../resource/resource-allocation-policy-engine.js";

describe("ResourceAllocationPolicyEngine", () => {
    it("should calculate total resource usage correctly for a set of steps", () => {
        const steps: PlanStep[] = [
            {
                id: "step1",
                description: "Step one",
                requiredResources: {
                    cpu: 1,
                    memory: 2,
                },
                estimatedDurationMs: 100,
            },
            {
                id: "step2",
                description: "Step two",
                requiredResources: {
                    cpu: 2,
                    memory: 1,
                    api_quota: 5,
                },
                estimatedDurationMs: 200,
            },
        ];

        const engine = new ResourceAllocationPolicyEngine();
        const totalUsage = engine.calculateTotalResourceUsage(steps);

        expect(totalUsage.cpu).toBe(3);
        expect(totalUsage.memory).toBe(3);
        expect(totalUsage.api_quota).toBe(5);
        expect(totalUsage.time).toBe(0);
    });

    it("should correctly determine if resource constraints are violated", () => {
        const steps: PlanStep[] = [
            {
                id: "step1",
                description: "Step one",
                requiredResources: {
                    cpu: 3,
                    memory: 1,
                },
                estimatedDurationMs: 100,
            },
            {
                id: "step2",
                description: "Step two",
                requiredResources: {
                    cpu: 1,
                    memory: 5,
                },
                estimatedDurationMs: 200,
            },
        ];

        const constraints: ResourceConstraints = {
            cpu: 4,
            memory: 5,
        };

        const engine = new ResourceAllocationPolicyEngine();
        const isViolated = engine.isResourceConstraintViolated(steps, constraints);

        expect(isViolated).toBe(true);
    });

    it("should handle empty plan steps gracefully", () => {
        const steps: PlanStep[] = [];
        const constraints: ResourceConstraints = {
            cpu: 10,
            memory: 10,
        };

        const engine = new ResourceAllocationPolicyEngine();
        const totalUsage = engine.calculateTotalResourceUsage(steps);
        const isViolated = engine.isResourceConstraintViolated(steps, constraints);

        expect(totalUsage).toEqual({
            cpu: 0,
            memory: 0,
            api_quota: 0,
            time: 0,
        });
        expect(isViolated).toBe(false);
    });
});