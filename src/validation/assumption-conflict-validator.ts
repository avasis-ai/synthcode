export interface Assumption {
    source: string;
    type: string;
    value: any;
    confidence: number;
}

export interface ConflictDetail {
    assumptionA: Assumption;
    assumptionB: Assumption;
    conflictMessage: string;
}

export interface ConflictReport {
    hasConflict: boolean;
    conflicts: ConflictDetail[];
}

export type ConflictRules = Map<string, (a: Assumption, b: Assumption) => string | null>;

export class AssumptionConflictValidator {
    private conflictRules: ConflictRules;

    constructor(conflictRules: ConflictRules) {
        this.conflictRules = conflictRules;
    }

    private getConflictMessage(assumptionA: Assumption, assumptionB: Assumption): string | null {
        const key1 = `${assumptionA.type}:${assumptionB.type}`;
        const key2 = `${assumptionB.type}:${assumptionA.type}`;

        if (this.conflictRules.has(key1)) {
            return this.conflictRules.get(key1)!(assumptionA, assumptionB);
        }
        if (this.conflictRules.has(key2)) {
            return this.conflictRules.get(key2)!(assumptionB, assumptionA);
        }
        return null;
    }

    public validate(assumptions: Assumption[]): ConflictReport {
        const conflicts: ConflictDetail[] = [];
        const n = assumptions.length;

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const assumptionA = assumptions[i];
                const assumptionB = assumptions[j];

                const conflictMessage = this.getConflictMessage(assumptionA, assumptionB);

                if (conflictMessage) {
                    conflicts.push({
                        assumptionA: assumptionA,
                        assumptionB: assumptionB,
                        conflictMessage: conflictMessage,
                    });
                }
            }
        }

        return {
            hasConflict: conflicts.length > 0,
            conflicts: conflicts,
        };
    }
}