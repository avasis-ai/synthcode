export type ResourceMap = Record<string, number>;

export interface ResourceRequirement {
  resourceName: string;
  usageAmount: number;
  durationSeconds: number;
}

export interface PlanStep {
  stepId: string;
  description: string;
  requirements: ResourceRequirement[];
}

export interface Plan {
  steps: PlanStep[];
}

export interface ProjectionResult {
  success: boolean;
  warnings: string[];
  finalUsage: Record<string, number>;
}

export class ResourceProjectionEngine {
  constructor() {}

  projectPlan(plan: Plan, initialResources: ResourceMap): ProjectionResult {
    const currentUsage: Record<string, number> = { ...initialResources };
    const warnings: string[] = [];

    for (const step of plan.steps) {
      const stepUsage: Record<string, number> = {};
      let conflictDetected = false;

      for (const requirement of step.requirements) {
        const { resourceName, usageAmount } = requirement;

        if (usageAmount < 0) {
          warnings.push(`Warning: Step ${step.stepId} has negative usage for ${resourceName}. Skipping.`);
          continue;
        }

        // Check for immediate conflict
        if (currentUsage[resourceName] === undefined || currentUsage[resourceName] < usageAmount) {
          warnings.push(
            `Conflict detected in step ${step.stepId}: Required ${resourceName} (${usageAmount}) exceeds available capacity (${currentUsage[resourceName] ?? 0}).`
          );
          conflictDetected = true;
        }

        // Accumulate usage (assuming usage is cumulative across the plan)
        stepUsage[resourceName] = (stepUsage[resourceName] || 0) + usageAmount;
      }

      // Update cumulative usage
      for (const resourceName in stepUsage) {
        const usage = stepUsage[resourceName];
        currentUsage[resourceName] = (currentUsage[resourceName] || 0) + usage;
      }

      if (conflictDetected) {
        // If a conflict is found, we stop projecting further usage changes
        // but we continue iterating to collect all warnings.
      }
    }

    const result: ProjectionResult = {
      success: warnings.some(w => w.includes("Conflict detected")),
      warnings: warnings,
      finalUsage: currentUsage,
    };

    return result;
  }
}

export { ResourceProjectionEngine };