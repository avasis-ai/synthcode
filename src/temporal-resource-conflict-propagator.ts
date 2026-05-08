import { EventEmitter } from "node:events";

interface ResourceRequirement {
  resourceName: string;
  quantity: number;
}

interface PlanStep {
  id: string;
  resourceRequirements: ResourceRequirement[];
  duration: number;
  // Time constraints in time units (e.g., minutes)
  earliestStart?: number;
  latestEnd?: number;
}

interface ConflictReport {
  resourceName: string;
  overlapStart: number;
  overlapEnd: number;
  conflictingSteps: { stepId: string; plannedStart: number; plannedEnd: number }[];
  suggestedMitigation: string;
}

export class TemporalResourceConflictPropagator {
  private conflicts: ConflictReport[] = [];

  /**
   * Analyzes a sequence of planned actions for resource conflicts over time.
   * @param planSteps An array of steps defining resource needs and timing.
   * @returns An array of ConflictReport detailing all detected conflicts.
   */
  public propagate(planSteps: PlanStep[]): ConflictReport[] {
    this.conflicts = [];
    const timeline: Map<string, { resource: string; usage: number[]; steps: PlanStep[] }> = new Map();

    // Initialize timeline for all required resources
    const allResources = new Set<string>();
    planSteps.forEach(step => {
      step.resourceRequirements.forEach(req => {
        allResources.add(req.resourceName);
      });
    });

    for (const resourceName of allResources) {
      timeline.set(resourceName, { resource: resourceName, usage: [], steps: [] });
    }

    // 1. Populate the timeline with planned usage
    for (const step of planSteps) {
      const plannedStart = step.earliestStart ?? 0;
      const plannedEnd = plannedStart + step.duration;

      for (const req of step.resourceRequirements) {
        const resourceName = req.resourceName;
        const timelineEntry = timeline.get(resourceName)!;

        // Record the usage interval for this resource
        timelineEntry.usage.push({
          start: plannedStart,
          end: plannedEnd,
          stepId: step.id,
          quantity: req.quantity,
        });
        timelineEntry.steps.push(step);
      }
    }

    // 2. Check for overlaps and conflicts
    for (const [resourceName, entry] of timeline.entries()) {
      this.checkConflictsForResource(resourceName, entry.usage);
    }

    return this.conflicts;
  }

  private checkConflictsForResource(resourceName: string, usageIntervals: { start: number; end: number; stepId: string; quantity: number }[]): void {
    // Sort intervals by start time
    usageIntervals.sort((a, b) => a.start - b.start);

    for (let i = 0; i < usageIntervals.length; i++) {
      for (let j = i + 1; j < usageIntervals.length; j++) {
        const intervalA = usageIntervals[i];
        const intervalB = usageIntervals[j];

        // Check for overlap
        const overlapStart = Math.max(intervalA.start, intervalB.start);
        const overlapEnd = Math.min(intervalA.end, intervalB.end);

        if (overlapStart < overlapEnd) {
          // Conflict detected
          const conflictingSteps: { stepId: string; plannedStart: number; plannedEnd: number }[] = [
            { stepId: intervalA.stepId, plannedStart: intervalA.start, plannedEnd: intervalA.end },
            { stepId: intervalB.stepId, plannedStart: intervalB.start, plannedEnd: intervalB.end },
          ];

          const report: ConflictReport = {
            resourceName: resourceName,
            overlapStart: overlapStart,
            overlapEnd: overlapEnd,
            conflictingSteps: conflictingSteps,
            suggestedMitigation: `The steps ${intervalA.stepId} and ${intervalB.stepId} overlap. Consider shifting the start time of the later step (${intervalB.stepId}) by ${Math.abs(intervalA.end - intervalB.start)} units to resolve the conflict.`,
          };

          // Simple check to prevent duplicate reports for the same pair
          if (!this.conflicts.some(c => c.resourceName === resourceName && c.overlapStart === overlapStart && c.overlapEnd === overlapEnd)) {
            this.conflicts.push(report);
          }
        }
      }
    }
  }
}