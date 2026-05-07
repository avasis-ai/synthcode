import {
  PlanStep,
  Resource,
  FeasibilityReport,
} from "./types";

class PlanFeasibilityValidator {
  private availableResources: Record<string, Resource>;

  constructor(availableResources: Record<string, Resource>) {
    this.availableResources = availableResources;
  }

  private checkResourceConflicts(plan: PlanStep[]): {
    conflicts: string[];
    isFeasible: boolean;
  } {
    const conflicts: string[] = [];
    const resourceUsage: Record<string, Map<number, number>> = {}; // ResourceName -> Map<TimeSlotIndex, UsedCapacity>

    for (let i = 0; i < plan.length; i++) {
      const step = plan[i];
      const stepConflicts: string[] = [];

      for (const [resourceName, requiredAmount] of Object.entries(step.requiredResources)) {
        if (!this.availableResources[resourceName]) {
          stepConflicts.push(`Resource ${resourceName} is unknown.`);
          continue;
        }

        const resource = this.availableResources[resourceName];
        let currentUsage = 0;

        // Simple check: Assume all steps run sequentially and check against total capacity
        // For a more complex check, we'd need to track time slots precisely.
        // Here, we check if the total required capacity exceeds the available capacity at any point.
        // Since we don't have precise time scheduling, we check against max capacity.
        if (requiredAmount > resource.capacity) {
          stepConflicts.push(
            `Insufficient capacity for ${resourceName}. Required: ${requiredAmount}, Available: ${resource.capacity}.`
          );
        }
      }
      if (stepConflicts.length > 0) {
        conflicts.push(`Step ${step.name} has resource issues: ${stepConflicts.join("; ")}`);
      }
    }

    return {
      conflicts,
      isFeasible: conflicts.length === 0,
    };
  }

  private checkTemporalInconsistencies(plan: PlanStep[]): {
    overlaps: string[];
    isFeasible: boolean;
  } {
    const overlaps: string[] = [];
    // Simple check: Assume all steps are scheduled sequentially and check for impossible overlaps
    // (This implementation assumes the plan structure handles time, but we'll check for logical overlaps if time slots are provided)

    for (let i = 0; i < plan.length; i++) {
      const stepA = plan[i];
      for (let j = i + 1; j < plan.length; j++) {
        const stepB = plan[j];

        // If both steps define a time slot, check for overlap
        if (stepA.timeSlot && stepB.timeSlot) {
          const startA = stepA.timeSlot.start;
          const endA = stepA.timeSlot.end;
          const startB = stepB.timeSlot.start;
          const endB = stepB.timeSlot.end;

          // Overlap condition: (StartA < EndB) AND (EndA > StartB)
          if (startA < endB && endA > startB) {
            overlaps.push(
              `Temporal overlap detected between '${stepA.name}' and '${stepB.name}'.`
            );
          }
        }
      }
    }

    return {
      overlaps,
      isFeasible: overlaps.length === 0,
    };
  }

  private checkDependencies(plan: PlanStep[]): {
    missingDependencies: string[];
    isFeasible: boolean;
  } {
    const missingDependencies: string[] = [];
    const stepNames = plan.map(s => s.name);

    for (const step of plan) {
      for (const dependencyName of step.dependencies) {
        if (!stepNames.includes(dependencyName)) {
          missingDependencies.push(
            `Step '${step.name}' depends on unknown step '${dependencyName}'.`
          );
        }
      }
    }

    return {
      missingDependencies,
      isFeasible: missingDependencies.length === 0,
    };
  }

  /**
   * Validates the entire plan against resource, temporal, and dependency constraints.
   * @param plan The sequence of steps to validate.
   * @returns A comprehensive feasibility report.
   */
  validate(plan: PlanStep[]): FeasibilityReport {
    const resourceCheck = this.checkResourceConflicts(plan);
    const temporalCheck = this.checkTemporalInconsistencies(plan);
    const dependencyCheck = this.checkDependencies(plan);

    const allFeasible =
      resourceCheck.isFeasible && temporalCheck.isFeasible && dependencyCheck.isFeasible;

    const adjustments: string[] = [];
    if (!resourceCheck.isFeasible) {
      adjustments.push("Review resource requirements and available capacities.");
    }
    if (!temporalCheck.isFeasible) {
      adjustments.push("Adjust time slots to avoid overlaps.");
    }
    if (!dependencyCheck.isFeasible) {
      adjustments.push("Ensure all dependencies are defined steps in the plan.");
    }

    const score = allFeasible ? 1.0 : 0.5;

    return {
      score,
      isFeasible: allFeasible,
      adjustments,
    };
  }
}

export { PlanFeasibilityValidator };