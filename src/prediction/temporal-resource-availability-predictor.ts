interface ResourceRequirement {
    resourceType: string;
    minAmount: number;
    duration: number;
}

interface PlanStep {
    id: string;
    requiredResources: ResourceRequirement[];
    // Assuming the step takes a certain amount of time to execute
    executionDuration: number;
}

type ResourceModel = Record<string, number>;

interface ResourceConflictReport {
    timestamp: number;
    resourceType: string;
    requiredAmount: number;
    availableCapacity: number;
    conflictDetails: string;
}

class TemporalResourceAvailabilityPredictor {
    private resourceModel: ResourceModel;

    constructor(resourceModel: ResourceModel) {
        this.resourceModel = resourceModel;
    }

    predict(planSteps: PlanStep[]): {
        conflicts: ResourceConflictReport[];
        predictedTimeline: Map<number, Record<string, number>>;
    } {
        const conflicts: ResourceConflictReport[] = [];
        // Map<Timestamp, ResourceType -> Current Usage>
        const resourceUsageTimeline: Map<number, Record<string, number>> = new Map();
        let currentTime = 0;

        for (const step of planSteps) {
            const stepStartTime = currentTime;
            const stepEndTime = stepStartTime + step.executionDuration;

            // 1. Check for conflicts during this step's execution
            for (const requirement of step.requiredResources) {
                const resourceType = requirement.resourceType;
                const requiredAmount = requirement.minAmount;

                if (requiredAmount > (this.resourceModel[resourceType] ?? 0)) {
                    conflicts.push({
                        timestamp: stepStartTime,
                        resourceType: resourceType,
                        requiredAmount: requiredAmount,
                        availableCapacity: this.resourceModel[resourceType] ?? 0,
                        conflictDetails: `Initial requirement exceeds total capacity.`
                    });
                }

                // Simulate usage over the duration
                for (let t = stepStartTime; t < stepEndTime; t++) {
                    const currentUsage = resourceUsageTimeline.get(t) || {};
                    const currentResourceUsage = currentUsage[resourceType] || 0;
                    const totalUsage = currentResourceUsage + requiredAmount;

                    if (totalUsage > (this.resourceModel[resourceType] ?? 0)) {
                        conflicts.push({
                            timestamp: t,
                            resourceType: resourceType,
                            requiredAmount: requiredAmount,
                            availableCapacity: this.resourceModel[resourceType] ?? 0,
                            conflictDetails: `Over-subscription detected. Total usage (${totalUsage}) exceeds capacity.`
                        });
                    }
                    
                    // Update usage for the timeline
                    const newUsage = { ...currentUsage };
                    newUsage[resourceType] = totalUsage;
                    resourceUsageTimeline.set(t, newUsage);
                }
            }

            // 2. Advance time
            currentTime = stepEndTime;
        }

        return {
            conflicts: conflicts,
            predictedTimeline: resourceUsageTimeline
        };
    }
}

export { TemporalResourceAvailabilityPredictor };