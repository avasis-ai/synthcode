interface Fact {
    key: string;
    value: any;
    source: string;
    confidence: number;
    expirationTimestamp: number;
    ingestionTime: number;
}

export class FactSourceManager {
    private facts: Map<string, Fact>;

    constructor() {
        this.facts = new Map<string, Fact>();
    }

    private isExpired(fact: Fact): boolean {
        return fact.expirationTimestamp < Date.now();
    }

    private cleanExpiredFacts(): void {
        const now = Date.now();
        for (const [key, fact] of this.facts.entries()) {
            if (fact.expirationTimestamp < now) {
                this.facts.delete(key);
            }
        }
    }

    public injectFact(
        key: string,
        value: any,
        source: string,
        confidence: number,
        expirationMinutes: number
    ): void {
        const expirationTimestamp = Date.now() + expirationMinutes * 60 * 1000;
        const newFact: Fact = {
            key,
            value,
            source,
            confidence,
            expirationTimestamp,
            ingestionTime: Date.now(),
        };

        this.facts.set(key, newFact);
    }

    public resolveConflict(
        key: string,
        newValue: any,
        newSource: string,
        newConfidence: number,
        newExpirationMinutes: number
    ): void {
        const existingFact = this.facts.get(key);

        if (!existingFact) {
            this.injectFact(key, newValue, newSource, newConfidence, newExpirationMinutes);
            return;
        }

        // Conflict Resolution Logic:
        // 1. If the new confidence is significantly higher, replace.
        // 2. If the new expiration is much longer, replace.
        // 3. Otherwise, keep the existing fact (assuming stability).

        const confidenceDelta = newConfidence - existingFact.confidence;
        const expirationDelta = (newExpirationMinutes * 60 * 1000) - (existingFact.expirationTimestamp - Date.now());

        const shouldReplace = confidenceDelta > 0.1 || expirationDelta > 10 * 60 * 1000;

        if (shouldReplace) {
            this.injectFact(key, newValue, newSource, newConfidence, newExpirationMinutes);
        } else {
            // Log or handle the conflict without updating the fact
        }
    }

    public getFacts(): Map<string, Fact> {
        this.cleanExpiredFacts();
        return new Map(this.facts);
    }

    public getFact(key: string): Fact | undefined {
        this.cleanExpiredFacts();
        return this.facts.get(key);
    }
}

export { FactSourceManager };