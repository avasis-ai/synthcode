export type ResourceType = "cpu" | "memory" | "network" | "quota";

export interface ResourceUsage {
  [key: string]: number;
}

export interface PlanStep {
  id: string;
  resourceRequirements: ResourceUsage;
  durationSeconds: number;
  startTimeSeconds: number;
}

export interface ConflictDetail {
  resource: ResourceType;
  timeWindowStart: number;
  timeWindowEnd: number;
  exceededLimit: number;
  actualUsage: number;
}

export interface MitigationSuggestion {
  strategy: "throttling" | "rescheduling" | "pre_allocation";
  description: string;
}

export interface ConflictReport {
  conflicts: ConflictDetail[];
  suggestions: MitigationSuggestion[];
  summary: string;
}

export class TemporalResourceConflictPredictor {

  private readonly resourceLimits: Record<ResourceType, number>;

  constructor(limits: Record<ResourceType, number>) {
    this.resourceLimits = limits;
  }

  private checkConflict(
    resource: ResourceType,
    startTime: number,
    endTime: number,
    currentUsage: number
  ): ConflictDetail | null {
    const limit = this.resourceLimits[resource];
    if (limit === undefined) {
      return null;
    }

    if (currentUsage > limit) {
      return {
        resource: resource,
        timeWindowStart: startTime,
        timeWindowEnd: endTime,
        exceededLimit: limit,
        actualUsage: currentUsage,
      };
    }
    return null;
  }

  private generateMitigation(conflicts: ConflictDetail[]): MitigationSuggestion[] {
    if (conflicts.length === 0) {
      return [];
    }

    const uniqueResources = Array.from(new Set(conflicts.map(c => c.resource)));

    const suggestions: MitigationSuggestion[] = [];

    if (uniqueResources.includes("cpu") || uniqueResources.includes("memory")) {
      suggestions.push({
        strategy: "throttling",
        description: "Consider throttling the resource-intensive steps during the conflict window to prevent overload.",
      });
    }

    if (conflicts.length > 3) {
      suggestions.push({
        strategy: "rescheduling",
        description: "Review the entire plan sequence. Rescheduling non-critical steps could alleviate cumulative resource pressure.",
      });
    }

    if (uniqueResources.includes("quota")) {
      suggestions.push({
        strategy: "pre_allocation",
        description: "Ensure external quotas are pre-allocated or request an increase before running the full plan.",
      });
    }

    return suggestions;
  }

  predictConflicts(steps: PlanStep[]): ConflictReport {
    if (!steps || steps.length === 0) {
      return {
        conflicts: [],
        suggestions: [],
        summary: "No steps provided. No conflicts predicted.",
      };
    }

    const conflicts: ConflictDetail[] = [];
    const timePoints = new Set<number>();

    steps.forEach(step => {
      timePoints.add(step.startTimeSeconds);
      timePoints.add(step.startTimeSeconds + step.durationSeconds);
    });

    const sortedTimePoints = Array.from(timePoints).sort((a, b) => a - b);

    const allConflicts: ConflictDetail[] = [];

    for (let i = 0; i < sortedTimePoints.length - 1; i++) {
      const intervalStart = sortedTimePoints[i];
      const intervalEnd = sortedTimePoints[i + 1];
      const duration = intervalEnd - intervalStart;

      if (duration <= 0) continue;

      let cumulativeUsage: Record<ResourceType, number> = {
        cpu: 0,
        memory: 0,
        network: 0,
        quota: 0,
      };

      // Calculate usage for this specific time interval
      for (const step of steps) {
        const stepStart = step.startTimeSeconds;
        const stepEnd = step.startTimeSeconds + step.durationSeconds;

        // Check if the step overlaps with the current interval
        if (Math.max(stepStart, intervalStart) < Math.min(stepEnd, intervalEnd)) {
          const usage = step.resourceRequirements;
          cumulativeUsage.cpu += usage.cpu || 0;
          cumulativeUsage.memory += usage.memory || 0;
          cumulativeUsage.network += usage.network || 0;
          cumulativeUsage.quota += usage.quota || 0;
        }
      }

      // Check for conflicts in the interval
      const resourceConflicts: ConflictDetail[] = [];
      for (const resource of ["cpu", "memory", "network", "quota"]) {
        const usage = cumulativeUsage[resource] || 0;
        const conflict = this.checkConflict(resource as ResourceType, intervalStart, intervalEnd, usage);
        if (conflict) {
          resourceConflicts.push(conflict);
        }
      }
      allConflicts.push(...resourceConflicts);
    }

    const suggestions = this.generateMitigation(allConflicts);

    const summary = `Prediction complete. Found ${Array.from(new Set(allConflicts.map(c => `${c.resource}:${c.timeWindowStart}-${c.timeWindowEnd}`)))?.length || 0} unique conflict periods.`;

    return {
      conflicts: allConflicts,
      suggestions: suggestions,
      summary: summary,
    };
  }
}

export { TemporalResourceConflictPredictor };