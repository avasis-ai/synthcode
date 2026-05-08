import { Goal } from "./goal";

export interface GoalWeights {
  urgencyWeight: number;
  impactWeight: number;
  costWeight: number;
}

export interface PrioritizedGoal {
  goal: Goal;
  score: number;
}

export class GoalPrioritizationEngine {
  private weights: GoalWeights;

  constructor(weights: GoalWeights) {
    this.weights = weights;
  }

  private calculateScore(goal: Goal): number {
    const { urgencyWeight, impactWeight, costWeight } = this.weights;

    // Assuming Goal has inherent properties matching the weights for calculation
    // Score = (Goal.Impact * ImpactWeight) + (Goal.Urgency * UrgencyWeight) - (Goal.Cost * CostWeight)
    const score = (
      (goal.impactScore || 0) * impactWeight +
      (goal.urgencyScore || 0) * urgencyWeight -
      (goal.costScore || 0) * costWeight
    );
    return score;
  }

  public prioritizeGoals(goals: Goal[]): PrioritizedGoal[] {
    const scoredGoals: PrioritizedGoal[] = goals.map((goal) => ({
      goal: goal,
      score: this.calculateScore(goal),
    }));

    scoredGoals.sort((a, b) => b.score - a.score);

    return scoredGoals;
  }
}