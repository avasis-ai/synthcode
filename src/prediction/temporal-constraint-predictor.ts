import { EventEmitter } from 'node:events';

type ResourceRequirements = Record<string, number>;

interface PredictedAction {
    name: string;
    startTime: number;
    duration: number;
    resources: ResourceRequirements;
}

interface Conflict {
    time: number;
    resource: string;
    message: string;
    exceededLimit?: number;
}

export interface PredictionReport {
    conflicts: Conflict[];
    summary: string;
}

export class TemporalConstraintPredictor {
    private resourceLimits: Record<string, number>;

    constructor(resourceLimits: Record<string, number>) {
        this.resourceLimits = resourceLimits;
    }

    private checkResourceExhaustion(
        time: number,
        currentUsage: Record<string, number>,
        action: PredictedAction
    ): Conflict | null {
        const newUsage = { ...currentUsage };
        let conflict: Conflict | null = null;

        for (const [resource, required] of Object.entries(action.resources)) {
            const totalUsage = (newUsage[resource] || 0) + required;
            const limit = this.resourceLimits[resource] || Infinity;

            if (totalUsage > limit) {
                conflict = {
                    time: time,
                    resource: resource,
                    message: `Resource ${resource} usage (${totalUsage.toFixed(2)}) exceeds limit (${limit}).`,
                    exceededLimit: limit,
                };
            }
            newUsage[resource] = totalUsage;
        }
        return conflict;
    }

    public predict(actions: PredictedAction[]): PredictionReport {
        const conflicts: Conflict[] = [];
        const sortedActions = [...actions].sort((a, b) => a.startTime - b.startTime);

        // Tracks resource usage at any given time point
        // Key: Time (number), Value: ResourceUsage (Record<string, number>)
        const resourceTimeline: Map<number, Record<string, number>> = new Map();

        for (let i = 0; i < sortedActions.length; i++) {
            const action = sortedActions[i];
            const endTime = action.startTime + action.duration;

            // 1. Check for resource exhaustion at the start time
            let currentUsageAtStart: Record<string, number> = {};
            
            // Aggregate usage from all previously scheduled actions that overlap or end at this time
            for (let j = 0; j < i; j++) {
                const prevAction = sortedActions[j];
                if (Math.max(action.startTime, prevAction.startTime) < Math.min(action.startTime + action.duration, prevAction.startTime + prevAction.duration)) {
                    // Overlap detected, calculate cumulative usage at the overlap point
                    for (const [resource, usage] of Object.entries(prevAction.resources)) {
                        currentUsageAtStart[resource] = (currentUsageAtStart[resource] || 0) + usage;
                    }
                }
            }

            const startConflict = this.checkResourceExhaustion(
                action.startTime,
                currentUsageAtStart,
                action
            );
            if (startConflict) {
                conflicts.push(startConflict);
            }

            // 2. Check for temporal overlaps (This is implicitly handled by the resource check if resources are cumulative)
            // We primarily focus on resource constraints over time.

            // Update the timeline (for advanced visualization/debugging, but mainly used for conflict detection here)
            // For simplicity, we only record the resource usage at the start time for conflict checking.
        }

        const summary = conflicts.length > 0
            ? `Prediction complete. Found ${conflicts.length} potential constraint violations.`
            : 'Prediction successful. No resource or temporal conflicts detected.';

        return {
            conflicts: conflicts,
            summary: summary,
        };
    }
}