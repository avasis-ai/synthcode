import { describe, it, expect } from "vitest";
import { CausalFlowValidator, PlanStep } from "../src/validation/causal-flow-validator";

describe("CausalFlowValidator", () => {
    it("should return valid result for a simple, correctly structured plan", () => {
        const planSteps: PlanStep[] = [
            {
                name: "Step 1",
                description: "Initial step",
                requiredInputs: {
                    context: { source: 'context', required: true, type: 'string' },
                },
                guaranteedOutputs: {
                    outputA: "string",
                },
            },
            {
                name: "Step 2",
                description: "Dependent step",
                requiredInputs: {
                    previous_step: { source: 'previous_step', required: true, type: 'string' },
                },
                guaranteedOutputs: {
                    outputB: "number",
                },
            },
        ];
        const validator = new CausalFlowValidator();
        const result = validator.validate(planSteps);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it("should detect missing required inputs for a step", () => {
        const planSteps: PlanStep[] = [
            {
                name: "Step 1",
                description: "Initial step",
                requiredInputs: {
                    context: { source: 'context', required: true, type: 'string' },
                },
                guaranteedOutputs: {
                    outputA: "string",
                },
            },
            {
                name: "Step 2",
                description: "Missing input step",
                requiredInputs: {
                    // Missing required input definition here
                },
                guaranteedOutputs: {
                    outputB: "number",
                },
            },
        ];
        const validator = new CausalFlowValidator();
        const result = validator.validate(planSteps);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Step 2: Missing required input definition for 'previous_step'.");
    });

    it("should detect conflicting output dependencies (e.g., output used before creation)", () => {
        const planSteps: PlanStep[] = [
            {
                name: "Step 1",
                description: "Step that produces outputA",
                requiredInputs: {
                    context: { source: 'context', required: true, type: 'string' },
                },
                guaranteedOutputs: {
                    outputA: "string",
                },
            },
            {
                name: "Step 2",
                description: "Step that incorrectly requires outputB",
                requiredInputs: {
                    previous_step: { source: 'previous_step', required: true, type: 'string' },
                    outputB: { source: 'previous_step', required: true, type: 'number' }, // outputB is never guaranteed
                },
                guaranteedOutputs: {
                    outputC: "boolean",
                },
            },
        ];
        const validator = new CausalFlowValidator();
        const result = validator.validate(planSteps);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Step 2: Dependency 'outputB' is required but not guaranteed by any preceding step.");
    });
});