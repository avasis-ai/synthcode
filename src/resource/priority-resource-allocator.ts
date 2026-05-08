export type PriorityWeight = {
    priorityScore: number;
    urgencyFactor: number;
};

export interface ResourceRequest {
    id: string;
    weight: PriorityWeight;
    requiredResources: Record<string, number>;
}

export class PriorityResourceAllocator {
    private activeRequests: Map<string, ResourceRequest> = new Map();
    private totalCapacity: Record<string, number>;

    constructor(totalCapacity: Record<string, number>) {
        this.totalCapacity = totalCapacity;
    }

    private calculateScore(weight: PriorityWeight): number {
        // Weighted scoring system: e.g., Score = Priority * (1 + Urgency)
        return weight.priorityScore * (1 + weight.urgencyFactor);
    }

    private calculateCurrentUsage(requests: Iterable<ResourceRequest>): Record<string, number> {
        const usage: Record<string, number> = {};
        for (const req of requests) {
            for (const resource in req.requiredResources) {
                const amount = req.requiredResources[resource];
                usage[resource] = (usage[resource] || 0) + amount;
            }
        }
        return usage;
    }

    /**
     * Determines if a new request can be allocated resources, potentially preempting lower-priority tasks.
     * @param newRequest The request to check.
     * @returns {boolean} True if allocation is possible.
     */
    public canAllocate(newRequest: ResourceRequest): boolean {
        const currentRequests = Array.from(this.activeRequests.values());
        const currentUsage = this.calculateCurrentUsage(currentRequests);
        const newUsage = { ...currentUsage };

        // Simulate adding the new request
        for (const resource in newRequest.requiredResources) {
            const amount = newRequest.requiredResources[resource];
            newUsage[resource] = (newUsage[resource] || 0) + amount;
        }

        // Check if the simulated usage exceeds capacity for any resource
        for (const resource in newUsage) {
            const usage = newUsage[resource];
            const capacity = this.totalCapacity[resource] || 0;
            if (usage > capacity) {
                return false;
            }
        }
        return true;
    }

    /**
     * Attempts to allocate resources for a new request. If capacity is exceeded, it attempts to preempt
     * the lowest scoring active request until the new request fits or no more preemption is possible.
     * @param newRequest The request to allocate.
     * @returns {boolean} True if the request was successfully allocated.
     */
    public allocate(newRequest: ResourceRequest): boolean {
        if (this.activeRequests.has(newRequest.id)) {
            return false;
        }

        let currentRequests = Array.from(this.activeRequests.values());
        let currentUsage = this.calculateCurrentUsage(currentRequests);

        // 1. Check if it fits without preemption
        if (this.canAllocate(newRequest)) {
            this.activeRequests.set(newRequest.id, newRequest);
            return true;
        }

        // 2. Preemption logic
        let preempted = false;
        let attempts = 0;
        const maxAttempts = currentRequests.length;

        while (attempts < maxAttempts) {
            // Sort existing requests by score (ascending: lowest score first)
            currentRequests.sort((a, b) => this.calculateScore(a.weight) - this.calculateScore(b.weight));

            // Identify the lowest scoring request that can be preempted
            const lowestScoreRequest = currentRequests[0];

            // Check if preempting this request allows the new request to fit
            const hypotheticalUsage = { ...currentUsage };
            
            // Remove resources of the lowest scoring request
            for (const resource in lowestScoreRequest.requiredResources) {
                const amount = lowestScoreRequest.requiredResources[resource];
                hypotheticalUsage[resource] = (hypotheticalUsage[resource] || 0) - amount;
            }

            // Add resources of the new request
            for (const resource in newRequest.requiredResources) {
                const amount = newRequest.requiredResources[resource];
                hypotheticalUsage[resource] = (hypotheticalUsage[resource] || 0) + amount;
            }

            // Check if the new usage is now within capacity
            let fitsAfterPreemption = true;
            for (const resource in hypotheticalUsage) {
                const usage = hypotheticalUsage[resource];
                const capacity = this.totalCapacity[resource] || 0;
                if (usage > capacity) {
                    fitsAfterPreemption = false;
                    break;
                }
            }

            if (fitsAfterPreemption) {
                // Preempt the lowest scoring request
                this.activeRequests.delete(lowestScoreRequest.id);
                
                // Add the new request
                this.activeRequests.set(newRequest.id, newRequest);
                preempted = true;
                return true;
            } else {
                // If preemption didn't help, we stop trying to preempt
                break;
            }

            // If we reached here, we must remove the preempted request from the list for the next iteration
            currentRequests = currentRequests.filter(r => r.id !== lowestScoreRequest.id);
            attempts++;
        }

        return false;
    }

    /**
     * Removes a request from active allocation.
     * @param requestId The ID of the request to remove.
     * @returns {boolean} True if the request was found and removed.
     */
    public release(requestId: string): boolean {
        if (this.activeRequests.has(requestId)) {
            this.activeRequests.delete(requestId);
            return true;
        }
        return false;
    }

    /**
     * Gets the current state of allocated resources.
     */
    public getCurrentUsage(): Record<string, number> {
        return this.calculateCurrentUsage(this.activeRequests.values());
    }
}