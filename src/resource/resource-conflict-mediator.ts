export interface ResourceRequest {
    resourceType: string;
    requiredAmount: number;
    duration: number;
    priority: number;
}

export interface AllocatedResource {
    resourceType: string;
    allocatedAmount: number;
    duration: number;
}

export interface AllocationPlan {
    successfulAllocations: AllocatedResource[];
    rejectedRequests: ResourceRequest[];
    totalResourcesUsed: Record<string, number>;
}

export class ResourceConflictMediator {
    private readonly totalCapacity: Record<string, number>;

    constructor(totalCapacity: Record<string, number>) {
        this.totalCapacity = totalCapacity;
    }

    private sortRequests(requests: ResourceRequest[]): ResourceRequest[] {
        // Strategy: Sort by highest priority first. If priorities are equal, sort by shortest duration (to maximize throughput).
        return [...requests].sort((a, b) => {
            if (b.priority !== a.priority) {
                return b.priority - a.priority;
            }
            return a.duration - b.duration;
        });
    }

    private checkAvailability(request: ResourceRequest, currentUsage: Record<string, number>): boolean {
        const resourceType = request.resourceType;
        const required = request.requiredAmount;
        const capacity = this.totalCapacity[resourceType] || 0;
        const used = currentUsage[resourceType] || 0;

        return (capacity - used) >= required;
    }

    private updateUsage(resourceType: string, amount: number, currentUsage: Record<string, number>): Record<string, number> {
        const newUsage = { ...currentUsage };
        newUsage[resourceType] = (newUsage[resourceType] || 0) + amount;
        return newUsage;
    }

    public mediate(requests: ResourceRequest[]): AllocationPlan {
        const sortedRequests = this.sortRequests(requests);

        let currentUsage: Record<string, number> = {};
        const successfulAllocations: AllocatedResource[] = [];
        const rejectedRequests: ResourceRequest[] = [];

        for (const request of sortedRequests) {
            if (this.checkAvailability(request, currentUsage)) {
                const allocatedResource: AllocatedResource = {
                    resourceType: request.resourceType,
                    allocatedAmount: request.requiredAmount,
                    duration: request.duration,
                };

                successfulAllocations.push(allocatedResource);
                currentUsage = this.updateUsage(request.resourceType, request.requiredAmount, currentUsage);
            } else {
                rejectedRequests.push(request);
            }
        }

        const totalResourcesUsed: Record<string, number> = {};
        successfulAllocations.forEach(allocation => {
            totalResourcesUsed[allocation.resourceType] = (totalResourcesUsed[allocation.resourceType] || 0) + allocation.allocatedAmount;
        });

        return {
            successfulAllocations,
            rejectedRequests,
            totalResourcesUsed,
        };
    }
}

export { ResourceConflictMediator };