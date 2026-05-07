interface ResourceRequest {
    id: string;
    name: string;
    predictedUsage: Record<string, number>;
    priority: number;
    costSensitivity: number;
    requiredResources: Record<string, number>;
}

interface AvailableResources {
    totalCapacity: Record<string, number>;
}

interface AllocatedResource {
    requestId: string;
    grantedResources: Record<string, number>;
    weight: number;
}

interface AllocationPlan {
    status: "SUCCESS" | "CONFLICT" | "THROTTLED";
    optimizationScore: number;
    allocatedResources: AllocatedResource[];
    remainingResources: Record<string, number>;
}

class ResourceContentionMediator {
    constructor() {}

    /**
     * Calculates a composite score for a request based on priority, predicted impact, and cost.
     * Higher score indicates higher suitability for immediate allocation.
     * @param request The resource request to score.
     * @param availableResources The current available resources.
     * @returns The calculated score.
     */
    private calculateScore(request: ResourceRequest, availableResources: AvailableResources): number {
        const resourceFitScore = Object.keys(request.requiredResources).reduce((acc, resource) => {
            const required = request.requiredResources[resource];
            const available = availableResources.totalCapacity[resource] || 0;
            return acc + Math.min(required, available) / required;
        }, 0);

        // Scoring formula: (Priority * Weight) + (Resource Fit Score * 0.5) - (Cost Sensitivity * 0.1)
        // Weights are arbitrary constants for demonstration.
        const score = (request.priority * 2) + (resourceFitScore * 0.5) - (request.costSensitivity * 0.1);
        return Math.max(0, score);
    }

    /**
     * Generates an optimized resource allocation plan for competing tasks.
     * @param pendingRequests List of tasks competing for resources.
     * @param availableResources The total available system resources.
     * @returns A structured AllocationPlan detailing the decision.
     */
    public mediate(pendingRequests: ResourceRequest[], availableResources: AvailableResources): AllocationPlan {
        let currentResources: Record<string, number> = { ...availableResources.totalCapacity };
        let allocatedResources: AllocatedResource[] = [];
        let totalScore = 0;
        let planStatus: "SUCCESS" | "CONFLICT" | "THROTTLED" = "SUCCESS";

        // 1. Score and sort requests
        const scoredRequests = pendingRequests
            .map(request => ({
                request,
                score: this.calculateScore(request, availableResources)
            }))
            .sort((a, b) => b.score - a.score);

        // 2. Iteratively allocate resources
        for (const { request: requestToAllocate, score: scoreValue } of scoredRequests) {
            let canAllocate = true;
            const grantedResources: Record<string, number> = {};

            // Check feasibility
            for (const resource in requestToAllocate.requiredResources) {
                const required = requestToAllocate.requiredResources[resource];
                const available = currentResources[resource] || 0;
                if (required > available) {
                    canAllocate = false;
                    break;
                }
            }

            if (canAllocate) {
                // Allocate resources
                for (const resource in requestToAllocate.requiredResources) {
                    const required = requestToAllocate.requiredResources[resource];
                    grantedResources[resource] = required;
                    currentResources[resource] -= required;
                }

                allocatedResources.push({
                    requestId: requestToAllocate.id,
                    grantedResources: grantedResources,
                    weight: scoreValue
                });
                totalScore += scoreValue;
            } else {
                // If the highest scoring task cannot be fully allocated, we might throttle or conflict.
                // For simplicity, we mark the plan as potentially throttled if resources are tight.
                if (pendingRequests.length > 0 && allocatedResources.length < pendingRequests.length) {
                    planStatus = "THROTTLED";
                }
            }
        }

        return {
            status: planStatus,
            optimizationScore: totalScore,
            allocatedResources: allocatedResources,
            remainingResources: currentResources
        };
    }
}

export { ResourceContentionMediator };