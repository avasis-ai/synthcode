interface ResourceRequirement {
    resourceId: string;
    resourceType: string;
    quantity: number;
    startTime: number;
    endTime: number;
}

interface ResourceState {
    availableCapacity: Record<string, number>;
    totalCapacity: Record<string, number>;
}

interface Action {
    name: string;
    resourceRequirements: ResourceRequirement[];
    // Assuming actions are processed sequentially or concurrently based on their defined time windows
}

interface ContentionReport {
    isContended: boolean;
    conflicts: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    details: string;
}

export class ResourceContentionSimulator {
    constructor() {}

    simulate(actions: Action[], currentState: ResourceState): ContentionReport {
        const resourceUsageTimeline: Record<string, number[]> = {};
        const resourceConflicts: string[] = [];
        let maxSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

        for (const resourceId in currentState.totalCapacity) {
            resourceUsageTimeline[resourceId] = [];
        }

        for (const action of actions) {
            for (const requirement of action.resourceRequirements) {
                const { resourceId, resourceType, quantity, startTime, endTime } = requirement;

                if (!resourceUsageTimeline[resourceId]) {
                    resourceUsageTimeline[resourceId] = [];
                }

                // 1. Check against total capacity
                const totalCapacity = currentState.totalCapacity[resourceId] || 0;
                if (quantity > totalCapacity) {
                    resourceConflicts.push(`Resource ${resourceId} (Type: ${resourceType}) requested ${quantity}, but total capacity is only ${totalCapacity}.`);
                    if (maxSeverity === 'LOW') maxSeverity = 'MEDIUM';
                    else if (maxSeverity === 'MEDIUM') maxSeverity = 'HIGH';
                    else if (maxSeverity === 'HIGH') maxSeverity = 'CRITICAL';
                }

                // 2. Check for temporal overlaps and cumulative usage
                let currentUsage = 0;
                let conflictFound = false;

                for (const existingRequirement of resourceUsageTimeline[resourceId]) {
                    const existingStart = existingRequirement.startTime;
                    const existingEnd = existingRequirement.endTime;
                    const existingQuantity = existingRequirement.quantity;

                    // Check for overlap: (StartA < EndB) and (EndA > StartB)
                    if (startTime < existingEnd && endTime > existingStart) {
                        currentUsage += existingQuantity;
                        if (currentUsage + quantity > totalCapacity) {
                            resourceConflicts.push(`Contention detected on ${resourceId} between time ${Math.min(startTime, existingStart)} and ${Math.max(endTime, existingEnd)}. Required: ${currentUsage + quantity}, Available: ${totalCapacity}.`);
                            conflictFound = true;
                        }
                    }
                }

                // Update timeline usage
                resourceUsageTimeline[resourceId].push({
                    startTime: startTime,
                    endTime: endTime,
                    quantity: quantity,
                    resourceType: resourceType
                });
            }
        }

        const isContended = resourceConflicts.length > 0;

        if (isContended) {
            if (maxSeverity === 'LOW') maxSeverity = 'MEDIUM';
            else if (maxSeverity === 'MEDIUM') maxSeverity = 'HIGH';
            else if (maxSeverity === 'HIGH') maxSeverity = 'CRITICAL';
        }

        return {
            isContended: isContended,
            conflicts: resourceConflicts,
            severity: maxSeverity,
            details: `Simulation completed. ${resourceConflicts.length} potential conflicts identified. Review the detailed resource usage timeline for precise timing issues.`
        };
    }
}