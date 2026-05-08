export interface Fact {
    id: string;
    statement: string;
    sourceId: string;
    timestamp: number;
    weight: number;
    confidence: number;
}

export class FactBaseManager {
    private facts: Map<string, Fact> = new Map();
    private sourceAuthorities: Map<string, number> = new Map();

    constructor() {}

    private getSourceAuthority(sourceId: string): number {
        if (!this.sourceAuthorities.has(sourceId)) {
            this.sourceAuthorities.set(sourceId, 1);
        }
        return this.sourceAuthorities.get(sourceId)!;
    }

    private updateSourceAuthority(sourceId: string): void {
        const currentAuthority = this.getSourceAuthority(sourceId);
        this.sourceAuthorities.set(sourceId, currentAuthority + 1);
    }

    public ingestFact(fact: Fact): void {
        const existingFact = this.facts.get(fact.id);

        if (existingFact) {
            const resolvedFact = this.resolveConflict(fact, existingFact);
            if (resolvedFact) {
                this.facts.set(fact.id, resolvedFact);
                this.updateSourceAuthority(fact.sourceId);
            }
        } else {
            this.facts.set(fact.id, { ...fact });
            this.updateSourceAuthority(fact.sourceId);
        }
    }

    public resolveConflict(newFact: Fact, existingFact: Fact): Fact | null {
        // Conflict resolution logic:
        // 1. Source Authority (Higher is better)
        // 2. Recency (Newer timestamp is better)
        // 3. Weight/Confidence (Higher is better)

        const newAuthority = this.getSourceAuthority(newFact.sourceId);
        const existingAuthority = this.getSourceAuthority(existingFact.sourceId);

        let winner: Fact;

        if (newAuthority > existingAuthority) {
            winner = newFact;
        } else if (existingAuthority > newAuthority) {
            winner = existingFact;
        } else {
            // Authorities are equal, check recency
            if (newFact.timestamp > existingFact.timestamp) {
                winner = newFact;
            } else if (existingFact.timestamp > newFact.timestamp) {
                winner = existingFact;
            } else {
                // Timestamps are equal, check weight/confidence
                const combinedScore = (f: Fact) => f.weight * f.confidence;
                if (combinedScore(newFact) >= combinedScore(existingFact)) {
                    winner = newFact;
                } else {
                    winner = existingFact;
                }
            }
        }

        // If the winner is the new fact, we must ensure its source authority is updated
        // (This is handled by the caller, ingestFact, but we return the winner)
        return winner;
    }

    public getFactBase(): Fact[] {
        return Array.from(this.facts.values());
    }
}

export { FactBaseManager };