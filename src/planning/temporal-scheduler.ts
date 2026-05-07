import {
  Message,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ResourceRequirements {
  [resourceName: string]: number;
}

export interface PlanStep {
  id: string;
  name: string;
  description: string;
  estimatedDurationSeconds: number;
  resourceCost: number;
  requiredResources: ResourceRequirements;
  // A simple heuristic score or utility value for sorting/selection
  utilityScore: number;
}

export interface Constraints {
  maxDurationSeconds: number;
  maxCost: number;
  availableResources: ResourceRequirements;
}

export class TemporalScheduler {
  constructor() {}

  /**
   * Generates an optimized, time-sequenced execution plan.
   * Uses a greedy approach to select steps that maximize utility while respecting constraints.
   * @param goal The high-level goal.
   * @param steps Potential steps/actions.
   * @param constraints Resource and time limits.
   * @returns An array of selected and ordered PlanSteps representing the optimal plan.
   */
  plan(
    goal: string,
    steps: PlanStep[],
    constraints: Constraints
  ): PlanStep[] {
    let currentPlan: PlanStep[] = [];
    let remainingCost = constraints.maxCost;
    let remainingDuration = constraints.maxDurationSeconds;
    let currentResources: ResourceRequirements = { ...constraints.availableResources };

    // Sort steps by utility score (descending) to prioritize the most valuable actions first
    const sortedSteps = [...steps].sort((a, b) => b.utilityScore - a.utilityScore);

    for (const step of sortedSteps) {
      // 1. Check resource feasibility
      const resourcesSufficient = Object.keys(step.requiredResources).every(
        (resource) =>
          (currentResources[resource] || 0) >= step.requiredResources[resource]
      );

      // 2. Check cost and time feasibility
      const costFeasible = step.resourceCost <= remainingCost;
      const durationFeasible = step.estimatedDurationSeconds <= remainingDuration;

      if (resourcesSufficient && costFeasible && durationFeasible) {
        // Step is feasible, add it to the plan
        currentPlan.push(step);

        // Update constraints and resources
        remainingCost -= step.resourceCost;
        remainingDuration -= step.estimatedDurationSeconds;

        Object.keys(step.requiredResources).forEach((resource) => {
          currentResources[resource] = (currentResources[resource] || 0) - step.requiredResources[resource];
        });
      }
    }

    // The plan is built greedily, but we might need to re-sort it if dependencies were involved.
    // Assuming steps are independent for this simplified model, the order of selection is sufficient.
    return currentPlan;
  }

  /**
   * Calculates the total estimated cost of a given plan.
   * @param plan The sequence of steps.
   * @returns The total cost.
   */
  calculateTotalCost(plan: PlanStep[]): number {
    return plan.reduce((total, step) => total + step.resourceCost, 0);
  }

  /**
   * Calculates the total estimated duration of a given plan.
   * @param plan The sequence of steps.
   * @returns The total duration in seconds.
   */
  calculateTotalDuration(plan: PlanStep[]): number {
    return plan.reduce((total, step) => total + step.estimatedDurationSeconds, 0);
  }
}