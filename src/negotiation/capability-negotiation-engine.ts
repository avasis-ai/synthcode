export interface CapabilityRequest {
    capability: string;
    componentId: string;
    urgency: number;
    impact: number;
    requiredDurationMs: number;
    weights: {
        urgency: number;
        impact: number;
        duration: number;
    };
}

export interface GrantedScope {
    capability: string;
    componentId: string;
    priority: number;
    durationMs: number;
    reason: string;
}

export interface NegotiationResult {
    grantedScopes: GrantedScope[];
    conflictsResolved: Record<string, string[]>;
}

export class CapabilityNegotiationEngine {
    private readonly defaultWeights: {
        urgency: number;
        impact: number;
        duration: number;
    } = {
        urgency: 0.4,
        impact: 0.4,
        duration: 0.2,
    };

    private calculateScore(request: CapabilityRequest): number {
        const { urgency, impact, requiredDurationMs } = request;
        const { urgency: wU, impact: wI, duration: wD } = this.defaultWeights;

        // Normalize duration contribution (e.g., log scale or simple scaling)
        // For simplicity, we use a weighted average of normalized inputs.
        // Assuming inputs (urgency, impact) are normalized 0-1.
        const durationScore = Math.min(1, requiredDurationMs / 60000); // Max duration weight contribution at 1 minute
        
        const score = (urgency * wU) + (impact * wI) + (durationScore * wD);
        return score;
    }

    private resolveConflictGroup(requests: CapabilityRequest[]): { winner: CapabilityRequest; losers: CapabilityRequest[] } {
        if (requests.length === 0) {
            throw new Error("Cannot resolve conflict group with no requests.");
        }

        let bestRequest = requests[0];
        let maxScore = this.calculateScore(bestRequest);

        for (let i = 1; i < requests.length; i++) {
            const currentRequest = requests[i];
            const score = this.calculateScore(currentRequest);

            if (score > maxScore) {
                maxScore = score;
                bestRequest = currentRequest;
            }
        }

        const losers = requests.filter(r => r.componentId !== bestRequest.componentId);
        return { winner: bestRequest, losers };
    }

    negotiate(requests: CapabilityRequest[]): NegotiationResult {
        const conflicts: Map<string, CapabilityRequest[]> = new Map();
        const componentRequests: Map<string, CapabilityRequest[]> = new Map();

        // 1. Group requests by capability
        for (const request of requests) {
            if (!conflicts.has(request.capability)) {
                conflicts.set(request.capability, []);
            }
            conflicts.get(request.capability)!.push(request);

            if (!componentRequests.has(request.componentId)) {
                componentRequests.set(request.componentId, []);
            }
            componentRequests.get(request.componentId)!.push(request);
        }

        const grantedScopes: GrantedScope[] = [];
        const conflictsResolved: Record<string, string[]> = {};

        // 2. Resolve conflicts for each capability
        for (const [capability, conflictGroup] of conflicts.entries()) {
            if (conflictGroup.length === 1) {
                // No conflict, grant immediately
                const request = conflictGroup[0];
                grantedScopes.push({
                    capability: capability,
                    componentId: request.componentId,
                    priority: 1.0,
                    durationMs: request.requiredDurationMs,
                    reason: "Exclusive access granted.",
                });
                continue;
            }

            // Conflict detected, resolve
            const { winner, losers } = this.resolveConflictGroup(conflictGroup);

            // Grant scope to winner
            grantedScopes.push({
                capability: capability,
                componentId: winner.componentId,
                priority: this.calculateScore(winner),
                durationMs: winner.requiredDurationMs,
                reason: `High priority access granted based on score ${this.calculateScore(winner).toFixed(2)}.`,
            });

            // Record conflict resolution
            if (!conflictsResolved[capability]) {
                conflictsResolved[capability] = [];
            }
            conflictsResolved[capability].push(winner.componentId, ...losers.map(l => l.componentId));
        }

        return {
            grantedScopes,
            conflictsResolved
        };
    }
}

export { CapabilityNegotiationEngine };