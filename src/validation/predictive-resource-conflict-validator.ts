interface PlanStep {
    startTime: number;
    duration: number;
    resources: {
        cpu: number;
        memory: number;
    };
    description: string;
}

interface ResourceLimits {
    maxCpu: number;
    maxMemory: number;
}

interface ConflictDetail {
    resource: "CPU" | "Memory" | "Time";
    startTime: number;
    endTime: number;
    exceededAmount: number;
    limit: number;
    stepsInvolved: PlanStep[];
}

interface ConflictReport {
    conflicts: ConflictDetail[];
    isConflict: boolean;
    suggestions: string[];
}

export class PredictiveResourceConflictValidator {
    private limits: ResourceLimits;

    constructor(limits: ResourceLimits) {
        this.limits = limits;
    }

    private checkResourceConflict(
        steps: PlanStep[],
        resourceKey: keyof typeof this.limits,
        limit: number
    ): ConflictDetail[] {
        const conflicts: ConflictDetail[] = [];
        const usageTimeline: { start: number; end: number; usage: number; steps: PlanStep[] }[] = [];

        for (const step of steps) {
            const usage = step.resources[resourceKey] || 0;
            const start = step.startTime;
            const end = start + step.duration;

            // Check for conflicts with existing usage intervals
            for (const existingUsage of usageTimeline) {
                // Check for overlap: max(start1, start2) < min(end1, end2)
                const overlapStart = Math.max(start, existingUsage.start);
                const overlapEnd = Math.min(end, existingUsage.end);

                if (overlapStart < overlapEnd) {
                    // Conflict detected
                    const totalUsage = existingUsage.usage + usage;
                    if (totalUsage > limit) {
                        conflicts.push({
                            resource: resourceKey === 'cpu' ? "CPU" : "Memory",
                            startTime: overlapStart,
                            endTime: overlapEnd,
                            exceededAmount: totalUsage,
                            limit: limit,
                            stepsInvolved: [...existingUsage.steps, step],
                        });
                    }
                }
            }

            // Update timeline (This simplified model assumes sequential addition for cumulative usage)
            // For a robust system, we would need to merge overlapping intervals, but for simplicity,
            // we track the usage of the current step and assume the timeline is built sequentially.
            usageTimeline.push({
                start: start,
                end: end,
                usage: usage,
                steps: [step],
            });
        }

        return conflicts;
    }

    validate(steps: PlanStep[]): ConflictReport {
        const conflicts: ConflictDetail[] = [];

        // 1. Check CPU conflicts
        const cpuConflicts = this.checkResourceConflict(steps, 'cpu', this.limits.maxCpu);
        conflicts.push(...cpuConflicts);

        // 2. Check Memory conflicts
        const memoryConflicts = this.checkResourceConflict(steps, 'memory', this.limits.maxMemory);
        conflicts.push(...memoryConflicts);

        const isConflict = conflicts.length > 0;
        let suggestions: string[] = [];

        if (isConflict) {
            suggestions.push("Review the overlapping steps identified in the conflict report.");
            suggestions.push("Consider staggering the execution times or reducing resource allocation for conflicting steps.");
        }

        return {
            conflicts: conflicts,
            isConflict: isConflict,
            suggestions: suggestions,
        };
    }
}