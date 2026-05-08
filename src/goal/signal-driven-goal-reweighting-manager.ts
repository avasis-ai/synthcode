import { EventEmitter } from "events";

export type GoalId = string;
export type GoalCriteria = "speed" | "accuracy" | "safety" | "efficiency";
export type SignalSource = "network" | "user_input" | "system_monitor" | "budget";
export type SignalSeverity = "low" | "medium" | "high";

export interface Signal {
  source: SignalSource;
  type: string;
  severity: SignalSeverity;
  impact: number;
  description: string;
}

export interface Goal {
  id: GoalId;
  name: string;
  baseWeight: number;
  criteria: GoalCriteria;
}

export interface WeightedGoal {
  goal: Goal;
  finalWeight: number;
}

export type GoalAdjustmentRule = (goal: Goal, signal: Signal) => number;

export class SignalDrivenGoalReweightingManager extends EventEmitter {
  private rules: Map<GoalCriteria, GoalAdjustmentRule>;

  constructor() {
    super();
    super.extend("SignalDrivenGoalReweightingManager");
    this.rules = new Map();
    this.initializeRules();
  }

  private initializeRules(): void {
    // Rule for Speed Goal: Penalize if high latency signal is present.
    this.rules.set("speed", (goal, signal) => {
      if (signal.source === "network" && signal.type === "high_latency" && signal.severity === "high") {
        return -0.2; // Decrease weight by 20%
      }
      return 0;
    });

    // Rule for Accuracy Goal: Increase weight if user impatience signal is present.
    this.rules.set("accuracy", (goal, signal) => {
      if (signal.source === "user_input" && signal.type === "impatience" && signal.severity === "medium") {
        return 0.15; // Increase weight by 15%
      }
      return 0;
    });

    // Rule for Safety Goal: Decrease weight if budget warning is high, suggesting resource constraints.
    this.rules.set("safety", (goal, signal) => {
      if (signal.source === "budget" && signal.type === "warning" && signal.severity === "high") {
        return -0.1;
      }
      return 0;
    });
  }

  private calculateAdjustment(goal: Goal, signals: Signal[]): number {
    let totalAdjustment = 0;
    const adjustmentRule = this.rules.get(goal.criteria);

    if (adjustmentRule) {
      for (const signal of signals) {
        totalAdjustment += adjustmentRule(goal, signal);
      }
    }
    return totalAdjustment;
  }

  reweightGoals(goals: Goal[], signals: Signal[]): WeightedGoal[] {
    if (!goals || goals.length === 0) {
      return [];
    }

    const weightedGoals: WeightedGoal[] = goals.map((goal) => {
      const adjustment = this.calculateAdjustment(goal, signals);
      let finalWeight = goal.baseWeight + adjustment;

      // Ensure weight remains within reasonable bounds [0.0, 1.0]
      finalWeight = Math.max(0.0, Math.min(1.0, finalWeight));

      return {
        goal: goal,
        finalWeight: finalWeight,
      };
    });

    return weightedGoals;
  }

  processSignalStream(signals: Signal[]): WeightedGoal[] {
    // In a real agent loop, we would need the current set of active goals here.
    // For this implementation, we assume a placeholder set of active goals.
    const placeholderGoals: Goal[] = [
      { id: "g1", name: "Achieve target speed", baseWeight: 0.4, criteria: "speed" },
      { id: "g2", name: "Maintain high accuracy", baseWeight: 0.3, criteria: "accuracy" },
      { id: "g3", name: "Ensure system safety", baseWeight: 0.3, criteria: "safety" },
    ];

    return this.reweightGoals(placeholderGoals, signals);
  }
}