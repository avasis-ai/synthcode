import { type Message } from "./message";

export interface Constraint {
  name: string;
  type: "max" | "min" | "target";
  targetValue: number;
  description: string;
}

export interface PerformanceMetrics {
  latencyMs: number;
  costUnits: number;
  resourceUsage: number;
}

export interface WeightedConstraintPayload {
  constraints: Record<string, {
    relaxed: boolean;
    weight: number;
    reason: string;
  }>;
  overallGoalScore: number;
}

export class ConstraintTradeoffEngine {
  private activeConstraints: Constraint[];
  private metrics: PerformanceMetrics;

  constructor(activeConstraints: Constraint[], metrics: PerformanceMetrics) {
    this.activeConstraints = activeConstraints;
    this.metrics = metrics;
  }

  private calculateViolationCost(constraint: Constraint, metricValue: number): number {
    const { type, targetValue } = constraint;

    if (type === "max") {
      if (metricValue > targetValue) {
        return metricValue - targetValue;
      }
      return 0;
    }

    if (type === "min") {
      if (metricValue < targetValue) {
        return targetValue - metricValue;
      }
      return 0;
    }

    if (type === "target") {
      const deviation = Math.abs(metricValue - targetValue);
      return deviation / targetValue;
    }
    return 0;
  }

  private scoreConstraint(constraint: Constraint): {
    violationCost: number;
    impactScore: number;
  } {
    let totalViolationCost = 0;

    // Simulate scoring across multiple metrics
    const metrics = this.metrics;
    
    if (constraint.name.includes("latency")) {
      totalViolationCost += this.calculateViolationCost(constraint, metrics.latencyMs);
    }
    if (constraint.name.includes("cost")) {
      totalViolationCost += this.calculateViolationCost(constraint, metrics.costUnits);
    }
    if (constraint.name.includes("resource")) {
      totalViolationCost += this.calculateViolationCost(constraint, metrics.resourceUsage);
    }

    // Simple impact score: higher violation cost means higher negative impact
    const impactScore = Math.max(0, totalViolationCost);

    return { violationCost: totalViolationCost, impactScore };
  }

  public calculateTradeoff(): WeightedConstraintPayload {
    const constraintScores: Record<string, {
      violationCost: number;
      impactScore: number;
    }> = {};

    for (const constraint of this.activeConstraints) {
      constraintScores[constraint.name] = this.scoreConstraint(constraint);
    }

    const weightedConstraints: Record<string, {
      relaxed: boolean;
      weight: number;
      reason: string;
    }> = {};
    let totalGoalScore = 0;

    for (const constraint of this.activeConstraints) {
      const score = constraintScores[constraint.name];
      
      // Decision Logic: If the violation cost is high (e.g., > 1.5 times the target deviation),
      // we recommend relaxation, but with a penalty (weight < 1).
      const relaxationThreshold = 1.5;
      const violationCost = score.violationCost;

      let relaxed = false;
      let weight = 1.0;
      let reason = "Adhering to constraint.";

      if (violationCost > 0 && violationCost > (constraint.targetValue * relaxationThreshold)) {
        relaxed = true;
        // Weight calculation: 1.0 - (Normalized Violation Cost / Max Possible Violation)
        // We use a simple decay factor based on how much we exceed the target.
        const excessFactor = violationCost / (constraint.targetValue || 1);
        weight = Math.max(0.5, 1.0 - Math.min(1.0, excessFactor * 0.2));
        reason = `High violation cost (${violationCost.toFixed(2)}). Relaxing constraint to achieve optimal outcome.`;
      }

      weightedConstraints[constraint.name] = {
        relaxed,
        weight,
        reason,
      };
      
      // Contribution to overall goal score (lower score is better, representing penalty)
      totalGoalScore += score.impactScore * (1 - weight);
    }

    return {
      constraints: weightedConstraints,
      overallGoalScore: totalGoalScore,
    };
  }
}