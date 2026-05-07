import { type PlanStep, type GlobalConstraints, type Conflict, type Correction, type Plan } from "./types";

export class PlanConflictPredictor {
    constructor(private constraints: GlobalConstraints) {}

    predict(plan: Plan): { feasible: boolean; conflict?: Conflict; revisedPlan?: Plan; corrections?: Correction[] } {
        const initialState = {
            resources: { ...this.constraints.initialResources },
            currentTime: 0,
            history: []
        };

        const result = this.solvePlan(plan, initialState);

        if (result.conflict) {
            return {
                feasible: false,
                conflict: result.conflict,
                revisedPlan: result.revisedPlan,
                corrections: result.corrections
            };
        } else {
            return {
                feasible: true,
                revisedPlan: result.finalPlan
            };
        }
    }

    private solvePlan(plan: Plan, initialState: { resources: Record<string, number>; currentTime: number; history: PlanStep[] }): { conflict?: Conflict; revisedPlan?: Plan; corrections?: Correction[]; finalPlan: Plan } {
        let currentState = { ...initialState };
        let currentPlan = [...plan];
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            const { conflict, nextState, updatedPlan } = this.simulateStep(currentPlan, currentState);

            if (!conflict) {
                // Success: The plan is feasible
                return { conflict: undefined, revisedPlan: undefined, corrections: undefined, finalPlan: updatedPlan };
            }

            // Conflict detected: Attempt to resolve
            attempts++;
            const conflictDetails = conflict;

            if (attempts === maxAttempts) {
                return { conflict: conflictDetails, revisedPlan: undefined, corrections: undefined, finalPlan: plan };
            }

            // Simplified Backtracking/Optimization:
            // 1. Suggest a correction based on the conflict.
            const suggestedCorrections = this.suggestMinimalChanges(conflictDetails, plan);

            if (suggestedCorrections.length === 0) {
                return { conflict: conflictDetails, revisedPlan: undefined, corrections: undefined, finalPlan: plan };
            }

            // 2. Apply the first suggested correction and update the plan.
            const correction = suggestedCorrections[0];
            const newPlan = this.applyCorrection(plan, correction);

            // 3. Reset state and try again with the modified plan
            currentState = {
                resources: { ...this.constraints.initialResources },
                currentTime: 0,
                history: []
            };
            currentPlan = newPlan;
        }

        return { conflict: undefined, revisedPlan: undefined, corrections: undefined, finalPlan: plan };
    }

    private simulateStep(plan: Plan, state: { resources: Record<string, number>; currentTime: number; history: PlanStep[] }): { conflict?: Conflict; nextState: { resources: Record<string, number>; currentTime: number; history: PlanStep[] }; updatedPlan: Plan } {
        let currentState = { ...state };
        let currentPlan = [...plan];
        let conflict: Conflict | undefined = undefined;

        for (let i = 0; i < currentPlan.length; i++) {
            const step = currentPlan[i];

            // 1. Check Resource Constraints
            for (const [resource, required] of Object.entries(step.resourceRequirements)) {
                if (required > 0 && currentState.resources[resource] === undefined || currentState.resources[resource] < required) {
                    conflict = {
                        stepIndex: i,
                        step: step,
                        reason: `Insufficient resource: ${resource}. Required: ${required}, Available: ${currentState.resources[resource] || 0}.`,
                        resource: resource,
                        needed: required
                    };
                    break;
                }
            }
            if (conflict) break;

            // 2. Check Temporal Constraints
            const endTime = currentState.currentTime + step.duration;
            if (endTime > this.constraints.temporalWindow.max) {
                conflict = {
                    stepIndex: i,
                    step: step,
                    reason: `Temporal violation. Estimated end time (${endTime}) exceeds global window (${this.constraints.temporalWindow.max}).`,
                    resource: "Time",
                    needed: 0
                };
                break;
            }

            // 3. Check Capability Availability (Simplified)
            if (step.requiredCapabilities.length > 0) {
                // Assume capability check is complex and passes if not explicitly modeled as a resource conflict
            }

            // If no conflict, update state
            currentState.resources = { ...currentState.resources, ...step.resourceRequirements };
            currentState.currentTime = endTime;
            currentState.history.push(step);
        }

        return {
            conflict: conflict,
            nextState: currentState,
            updatedPlan: currentPlan
        };
    }

    private suggestMinimalChanges(conflict: Conflict, originalPlan: Plan): { correction: Correction; plan: Plan } {
        const conflictStep = conflict.step;
        const conflictIndex = conflict.stepIndex;

        // Strategy 1: Resource Over-allocation -> Suggest increasing budget/resource.
        if (conflict.resource && conflict.reason.includes("Insufficient resource")) {
            const correction: Correction = {
                type: "increase_budget",
                targetStepIndex: conflictIndex,
                resource: conflict.resource,
                amount: conflict.needed - (conflict.step.resourceRequirements[conflict.resource] || 0)
            };
            return { correction, plan: originalPlan };
        }

        // Strategy 2: Temporal Violation -> Suggest reordering or reducing duration.
        if (conflict.reason.includes("Temporal violation")) {
            const correction: Correction = {
                type: "reorder_steps",
                targetStepIndex: conflictIndex,
                suggestedOrder: [conflictIndex - 1, conflictIndex] // Example: swap current step with previous
            };
            return { correction, plan: originalPlan };
        }

        // Default fallback
        const correction: Correction = {
            type: "review_constraints",
            targetStepIndex: conflictIndex,
            message: "Review global constraints or resource budgets."
        };
        return { correction, plan: originalPlan };
    }

    private applyCorrection(originalPlan: Plan, correction: Correction): Plan {
        let newPlan = [...originalPlan];

        switch (correction.type) {
            case "increase_budget":
                const index = correction.targetStepIndex;
                if (index >= 0 && index < newPlan.length) {
                    const step = newPlan[index];
                    const resource = correction.resource;
                    const amount = correction.amount;
                    if (step.resourceRequirements[resource] !== undefined) {
                        newPlan[index] = {
                            ...step,
                            resourceRequirements: {
                                ...step.resourceRequirements,
                                [resource]: (step.resourceRequirements[resource] || 0) + amount
                            }
                        };
                    }
                }
                break;
            case "reorder_steps":
                const { targetStepIndex, suggestedOrder } = correction;
                if (suggestedOrder.length === 2) {
                    const [i, j] = suggestedOrder;
                    if (i >= 0 && j >= 0 && i < j && j < newPlan.length) {
                        // Swap steps i and j
                        [newPlan[i], newPlan[j]] = [newPlan[j], newPlan[i]];
                    }
                }
                break;
            case "review_constraints":
                // No structural change, just signal the need for manual review
                break;
        }
        return newPlan;
    }
}