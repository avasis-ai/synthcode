interface Fact {
    subject: string;
    predicate: string;
    object: string;
    sourceId: string;
}

interface ContradictionReport {
    factA: Fact;
    factB: Fact;
    reason: string;
}

class FactContradictionValidator {
    private readonly contradictoryPredicates: Map<string, Set<string>>;

    constructor() {
        this.contradictoryPredicates = new Map();
        // Initialize known contradictory pairs (e.g., 'is_alive' vs 'is_deceased')
        this.contradictoryPredicates.set("person", new Set(["is_alive", "is_deceased"]));
        this.contradictoryPredicates.set("location", new Set(["is_open", "is_closed"]));
    }

    private isContradictory(subject: string, predicateA: string, predicateB: string): boolean {
        if (!this.contradictoryPredicates.has(subject)) {
            return false;
        }
        const predicates = this.contradictoryPredicates.get(subject)!;
        
        // Simple check: if the pair of predicates is known to be contradictory for this subject type
        if (predicateA === "is_alive" && predicateB === "is_deceased") return true;
        if (predicateA === "is_deceased" && predicateB === "is_alive") return true;
        if (predicateA === "is_open" && predicateB === "is_closed") return true;
        if (predicateA === "is_closed" && predicateB === "is_open") return true;
        
        return false;
    }

    validate(facts: Fact[]): ContradictionReport[] {
        const contradictions: ContradictionReport[] = [];
        
        for (let i = 0; i < facts.length; i++) {
            for (let j = i + 1; j < facts.length; j++) {
                const factA = facts[i];
                const factB = facts[j];

                // 1. Check for Subject/Predicate/Object conflicts (A vs B)
                if (factA.subject === factB.subject) {
                    
                    // Check for mutually exclusive predicates on the same subject
                    if (this.isContradictory(factA.subject, factA.predicate, factB.predicate)) {
                        contradictions.push({
                            factA: factA,
                            factB: factB,
                            reason: `Contradiction detected: Predicates '${factA.predicate}' and '${factB.predicate}' are mutually exclusive for subject '${factA.subject}'.`
                        });
                        continue;
                    }

                    // Check for conflicting object values with the same predicate
                    if (factA.predicate === factB.predicate && factA.object !== factB.object) {
                        contradictions.push({
                            factA: factA,
                            factB: factB,
                            reason: `Conflict detected: Predicate '${factA.predicate}' has conflicting objects ('${factA.object}' vs '${factB.object}') for subject '${factA.subject}'.`
                        });
                        continue;
                    }
                }
            }
        }

        return contradictions;
    }
}

export { FactContradictionValidator };