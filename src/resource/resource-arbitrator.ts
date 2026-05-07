export interface ResourceRequest {
    requestId: string;
    resourceId: string;
    requiredAmount: number;
    priority: number;
    stepId: string;
}

export interface GrantedRequest {
    request: ResourceRequest;
    isGranted: boolean;
    reason?: string;
}

export interface ArbitrationResult {
    plan: GrantedRequest[];
    updatedUsage: Record<string, number>;
}

export class ResourceArbitrator {
    private readonly initialUsage: Record<string, number>;

    constructor(initialUsage: Record<string, number> = {}) {
        this.initialUsage = initialUsage;
    }

    private getAvailableResource(resourceId: string, currentUsage: Record<string, number>): number {
        const totalCapacity = this.initialUsage[resourceId] || 0;
        const used = currentUsage[resourceId] || 0;
        return totalCapacity - used;
    }

    private sortRequests(requests: ResourceRequest[]): ResourceRequest[] {
        // Sort by priority (higher number = higher priority)
        // Secondary sort by required amount (larger requirement first, to resolve critical path items)
        return [...requests].sort((a, b) => {
            if (b.priority !== a.priority) {
                return b.priority - a.priority;
            }
            return b.requiredAmount - a.requiredAmount;
        });
    }

    public arbitrate(requests: ResourceRequest[]): ArbitrationResult {
        const sortedRequests = this.sortRequests(requests);
        let currentUsage: Record<string, number> = { ...this.initialUsage };
        const plan: GrantedRequest[] = [];

        for (const request of sortedRequests) {
            const available = this.getAvailableResource(request.resourceId, currentUsage);

            if (available >= request.requiredAmount) {
                // Grant resource
                currentUsage[request.resourceId] = (currentUsage[request.resourceId] || 0) + request.requiredAmount;
                plan.push({
                    request: request,
                    isGranted: true,
                });
            } else {
                // Deny resource
                const remaining = Math.max(0, available);
                plan.push({
                    request: request,
                    isGranted: false,
                    reason: `Insufficient resource. Required: ${request.requiredAmount}, Available: ${remaining}.`
                });
            }
        }

        return {
            plan: plan,
            updatedUsage: currentUsage
        };
    }
}

export { ResourceArbitrator };