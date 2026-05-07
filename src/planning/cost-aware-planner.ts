import { Message, ContentBlock, TextBlock } from "./types";

type Plan = {
  steps: { action: string; cost: number }[];
  totalCost: number;
};

type Action = {
  name: string;
  description: string;
  estimatedCost: number;
};

type CostEstimator = (actions: Action[]) => number;

export class CostAwarePlanner {
  private budget: number;
  private costEstimator: CostEstimator;

  constructor(budget: number, costEstimator: CostEstimator) {
    this.budget = budget;
    this.costEstimator = costEstimator;
  }

  private calculatePlanCost(actions: Action[]): number {
    return this.costEstimator(actions);
  }

  /**
   * Generates a preliminary plan, prioritizing cost feasibility.
   * @param goal The overall goal description.
   * @param availableActions A list of possible actions the agent can take.
   * @returns The best feasible plan, or null if no plan fits the budget.
   */
  public plan(goal: string, availableActions: Action[]): Plan | null {
    const candidatePlans: { plan: Plan; cost: number }[] = [];

    // Simplified planning logic: Assume we generate a set of potential action sequences
    // In a real system, this would involve search algorithms (A*, Beam Search, etc.)
    // Here, we simulate generating a few candidate plans.

    const candidateSequences: Action[][] = [
      availableActions.slice(0, 2), // Plan 1: Short, simple
      availableActions.slice(0, 3), // Plan 2: Medium complexity
      availableActions,            // Plan 3: Full attempt
    ];

    for (const actions of candidateSequences) {
      const totalCost = this.calculatePlanCost(actions);
      const plan: Plan = {
        steps: actions.map(a => ({ action: a.name, cost: a.estimatedCost })),
        totalCost: totalCost,
      };
      candidatePlans.push({ plan, cost: totalCost });
    }

    // Filter for plans within budget
    const feasiblePlans = candidatePlans.filter(item => item.cost <= this.budget);

    if (feasiblePlans.length === 0) {
      return null;
    }

    // Select the lowest cost feasible plan
    feasiblePlans.sort((a, b) => a.cost - b.cost);

    return feasiblePlans[0].plan;
  }

  /**
   * Adjusts an existing plan if its predicted cost exceeds the budget,
   * attempting to find a cheaper, equivalent alternative.
   * @param currentPlan The plan to evaluate.
   * @param availableActions All possible actions.
   * @returns A revised Plan or null if adjustment fails.
   */
  public adjustPlan(currentPlan: Plan, availableActions: Action[]): Plan | null {
    if (currentPlan.totalCost <= this.budget) {
      return currentPlan;
    }

    // Attempt to find a cheaper plan using the planning logic again,
    // but this time, we prioritize cost reduction over completeness.
    const newPlan = this.plan("Goal achieved via cost reduction", availableActions);

    if (newPlan) {
      return newPlan;
    }

    return null;
  }
}