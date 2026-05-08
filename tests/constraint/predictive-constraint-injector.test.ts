import { describe, it, expect } from "vitest";
import { Context, PredictiveConstraintInjector } from "../src/constraint/predictive-constraint-injector";

describe("PredictiveConstraintInjector", () => {
    it("should inject constraints based on predicted resource usage when usage exceeds a threshold", () => {
        const context: Context = {
            currentState: {
                resourceA: 10,
                resourceB: 5,
            },
            planSteps: [
                {
                    action: "useResourceA",
                    params: {
                        amount: 20,
                    },
                    predictedResourceUsage: {
                        resourceA: 15,
                        resourceB: 2,
                    },
                },
                {
                    action: "useResourceB",
                    params: {
                        amount: 30,
                    },
                    predictedResourceUsage: {
                        resourceA: 5,
                        resourceB: 25,
                    },
                },
            ],
            currentTime: 100,
        };

        const injector = new PredictiveConstraintInjector(0.1); // Threshold 10%
        const constraints = injector.injectConstraints(context);

        expect(constraints).toHaveLength(2);
        expect(constraints).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    key: "resourceA",
                    severity: "hard",
                    description: expect.stringContaining("predicted usage exceeds threshold"),
                }),
                expect.objectContaining({
                    key: "resourceB",
                    severity: "hard",
                    description: expect.stringContaining("predicted usage exceeds threshold"),
                }),
            ])
        );
    });

    it("should not inject constraints if all predicted resource usages are below the threshold", () => {
        const context: Context = {
            currentState: {
                resourceA: 10,
                resourceB: 5,
            },
            planSteps: [
                {
                    action: "useResourceA",
                    params: {
                        amount: 5,
                    },
                    predictedResourceUsage: {
                        resourceA: 1,
                        resourceB: 0.5,
                    },
                },
                {
                    action: "useResourceB",
                    params: {
                        amount: 10,
                    },
                    predictedResourceUsage: {
                        resourceA: 0.5,
                        resourceB: 1,
                    },
                },
            ],
            currentTime: 100,
        };

        const injector = new PredictiveConstraintInjector(0.5); // Threshold 50%
        const constraints = injector.injectConstraints(context);

        expect(constraints).toHaveLength(0);
    });

    it("should handle empty plan steps gracefully and return no constraints", () => {
        const context: Context = {
            currentState: {
                resourceA: 10,
                resourceB: 5,
            },
            planSteps: [],
            currentTime: 100,
        };

        const injector = new PredictiveConstraintInjector(0.1);
        const constraints = injector.injectConstraints(context);

        expect(constraints).toHaveLength(0);
    });
});