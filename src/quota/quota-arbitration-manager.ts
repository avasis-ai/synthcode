interface QuotaRequest {
    resourceType: string;
    requestedAmount: number;
    priorityScore: number;
    requestId: string;
}

interface QuotaState {
    resourceType: string;
    availableAmount: number;
}

export class QuotaArbitrationManager {
    private globalQuotas: Map<string, number>;
    private quotas: Map<string, QuotaState>;

    constructor(initialQuotas: Record<string, number>) {
        this.globalQuotas = new Map();
        this.quotas = new Map();
        for (const [resourceType, amount] of Object.entries(initialQuotas)) {
            this.globalQuotas.set(resourceType, amount);
            this.quotas.set(resourceType, { resourceType, availableAmount: amount });
        }
    }

    private getQuotaState(resourceType: string): QuotaState | undefined {
        return this.quotas.get(resourceType);
    }

    private updateQuota(resourceType: string, amount: number): boolean {
        const currentState = this.quotas.get(resourceType);
        if (!currentState || currentState.availableAmount < amount) {
            return false;
        }
        const newAmount = currentState.availableAmount - amount;
        this.quotas.set(resourceType, { resourceType, availableAmount: newAmount });
        return true;
    }

    /**
     * Arbitrates resources among a list of requests based on priority and availability.
     * @param requests The incoming list of requests.
     * @returns An object containing the list of fulfilled requests and the updated quota state.
     */
    public arbitrate(requests: QuotaRequest[]): { fulfilledRequests: QuotaRequest[]; updatedQuotas: Record<string, number> } {
        // 1. Sort requests: Higher priority score first.
        // Secondary sort: Larger requested amount first (to ensure critical paths are considered).
        const sortedRequests = [...requests].sort((a, b) => {
            if (b.priorityScore !== a.priorityScore) {
                return b.priorityScore - a.priorityScore;
            }
            return b.requestedAmount - a.requestedAmount;
        });

        const fulfilledRequests: QuotaRequest[] = [];
        const initialQuotasSnapshot = new Map(this.quotas);

        for (const request of sortedRequests) {
            if (this.updateQuota(request.resourceType, request.requestedAmount)) {
                fulfilledRequests.push(request);
            }
        }

        const updatedQuotas: Record<string, number> = {};
        for (const [key, state] of this.quotas.entries()) {
            updatedQuotas[key] = state.availableAmount;
        }

        return {
            fulfilledRequests,
            updatedQuotas
        };
    }

    public getCurrentQuotas(): Record<string, number> {
        const quotas: Record<string, number> = {};
        for (const [key, state] of this.quotas.entries()) {
            quotas[key] = state.availableAmount;
        }
        return quotas;
    }
}