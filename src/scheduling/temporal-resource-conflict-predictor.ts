export type ResourceName = string;

export interface ResourceConstraints {
  [resourceName: ResourceName]: number;
}

export interface PlanStep {
  id: string;
  startTime: number;
  endTime: number;
  resourceUsage: Record<ResourceName, number>;
  dependencies?: string[];
}

export type ConflictSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface TemporalResourceConflict {
  resource: ResourceName;
  startTime: number;
  endTime: number;
  severity: ConflictSeverity;
  details: string;
}

export class TemporalResourceConflictPredictor {
  predictConflicts(planSteps: PlanStep[], resources: ResourceConstraints[]): TemporalResourceConflict[] {
    if (!planSteps || planSteps.length === 0) {
      return [];
    }

    const resourceMap = new Map<ResourceName, number>();
    for (const constraints of resources) {
      Object.entries(constraints).forEach(([resource, capacity]) => {
        resourceMap.set(resource, capacity);
      });
    }

    const conflicts: TemporalResourceConflict[] = [];
    const resourceTimeline: Map<ResourceName, Map<number, number>> = new Map();

    for (const [resourceName, capacity] of resourceMap.entries()) {
      resourceTimeline.set(resourceName, new Map<number, number>());
    }

    for (const step of planSteps) {
      for (const [resourceName, usage] of Object.entries(step.resourceUsage)) {
        if (!resourceMap.has(resourceName)) {
          continue;
        }

        const timeline = resourceTimeline.get(resourceName)!;

        for (let t = Math.max(0, Math.floor(step.startTime)); t < Math.ceil(step.endTime); t++) {
          const currentUsage = timeline.get(t) || 0;
          const newUsage = currentUsage + usage;

          if (newUsage > resourceMap.get(resourceName)!) {
            const conflict = {
              resource: resourceName,
              startTime: t,
              endTime: t + 1,
              severity: "HIGH",
              details: `Resource capacity exceeded. Usage: ${newUsage}/${resourceMap.get(resourceName)!}. Step ID: ${step.id}.`,
            };
            conflicts.push(conflict);
          }

          timeline.set(t, newUsage);
        }
      }
    }

    return conflicts;
  }
}