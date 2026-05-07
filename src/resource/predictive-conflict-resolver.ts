import { Message, ContentBlock, ToolUseBlock } from "./types.js";

export type ResourceModel = {
  budget: number;
  time: number;
  capacity: number;
};

export type Step = {
  name: string;
  requiredResources: {
    budget: number;
    time: number;
    capacity: number;
  };
  description: string;
};

export type ConflictSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ConflictPredictionResult {
  conflict: string;
  severity: ConflictSeverity;
  resourceAffected: keyof ResourceModel;
  message: string;
  suggestedAdjustment: {
    type: "REDUCE_RESOURCE" | "REORDER_STEPS" | "INTERVENTION_REQUIRED";
    details: string;
  };
}

export class PredictiveResourceConflictResolver {
  private initialResources: ResourceModel;

  constructor(initialResources: ResourceModel) {
    this.initialResources = initialResources;
  }

  private checkConflict(
    currentResources: ResourceModel,
    step: Step,
    resourceKey: keyof ResourceModel
  ): ConflictPredictionResult | null {
    const required = step.requiredResources[resourceKey];
    const available = currentResources[resourceKey];

    if (available < required) {
      let severity: ConflictSeverity = "MEDIUM";
      if (available < required * 0.5) {
        severity = "CRITICAL";
      } else if (available < required) {
        severity = "HIGH";
      }

      return {
        conflict: `Insufficient ${resourceKey} for step: ${step.name}`,
        severity: severity,
        resourceAffected: resourceKey,
        message: `The plan requires ${required} ${resourceKey}, but only ${available} is available.`,
        suggestedAdjustment: {
          type: "REDUCE_RESOURCE",
          details: `Reduce the required ${resourceKey} for this step or acquire more resources.`
        }
      };
    }
    return null;
  }

  private analyzeStep(
    currentResources: ResourceModel,
    step: Step
  ): {
    conflicts: ConflictPredictionResult[];
    nextResources: ResourceModel;
  } {
    let conflicts: ConflictPredictionResult[] = [];
    let nextResources: ResourceModel = { ...currentResources };

    // 1. Check for conflicts
    const conflictChecks: Array<{ key: keyof ResourceModel, check: (r: ResourceModel, s: Step) => ConflictPredictionResult | null }> = [
      { key: "budget", check: (r, s) => this.checkConflict(r, s, "budget") },
      { key: "time", check: (r, s) => this.checkConflict(r, s, "time") },
      { key: "capacity", check: (r, s) => this.checkConflict(r, s, "capacity") },
    ];

    for (const { key, check } of conflictChecks) {
      const conflict = check(currentResources, step);
      if (conflict) {
        conflicts.push(conflict);
      }
    }

    // 2. Calculate next resource state (assuming no conflicts for calculation purposes)
    nextResources = {
      budget: currentResources.budget - step.requiredResources.budget,
      time: currentResources.time - step.requiredResources.time,
      capacity: currentResources.capacity - step.requiredResources.capacity,
    };

    return { conflicts, nextResources };
  }

  /**
   * Analyzes a sequence of steps against initial resource constraints.
   * @param plan The sequence of steps to analyze.
   * @returns A tuple containing the list of all predicted conflicts and the final resource state.
   */
  public analyzePlan(plan: Step[]): {
    conflicts: ConflictPredictionResult[];
    finalResources: ResourceModel;
  } {
    let accumulatedConflicts: ConflictPredictionResult[] = [];
    let currentResources: ResourceModel = { ...this.initialResources };

    for (const step of plan) {
      const analysis = this.analyzeStep(currentResources, step);
      accumulatedConflicts.push(...analysis.conflicts);
      currentResources = analysis.nextResources;
    }

    return {
      conflicts: accumulatedConflicts,
      finalResources: currentResources,
    };
  }
}