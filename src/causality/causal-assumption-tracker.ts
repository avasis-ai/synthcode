export interface Assumption {
    id: string;
    source: string;
    fact: string;
    confidence: number;
    isActive: boolean;
    invalidationReason?: string;
}

export class CausalAssumptionTracker {
    private assumptions: Map<string, Assumption>;

    constructor() {
        this.assumptions = new Map<string, Assumption>();
    }

    addAssumption(assumption: Assumption): void {
        if (this.assumptions.has(assumption.id)) {
            console.warn(`Assumption ID ${assumption.id} already exists. Overwriting.`);
        }
        this.assumptions.set(assumption.id, {
            ...assumption,
            isActive: true,
            invalidationReason: undefined
        });
    }

    invalidateAssumption(assumptionId: string, reason: string): boolean {
        const assumption = this.assumptions.get(assumptionId);
        if (!assumption) {
            return false;
        }

        const updatedAssumption: Assumption = {
            ...assumption,
            isActive: false,
            invalidationReason: reason
        };

        this.assumptions.set(assumptionId, updatedAssumption);
        return true;
    }

    getAssumptions(): Assumption[] {
        return Array.from(this.assumptions.values()).filter(a => a.isActive);
    }

    getInvalidAssumptions(): Assumption[] {
        return Array.from(this.assumptions.values()).filter(a => !a.isActive);
    }

    hasAssumption(assumptionId: string): boolean {
        return this.assumptions.has(assumptionId);
    }
}

export { CausalAssumptionTracker };