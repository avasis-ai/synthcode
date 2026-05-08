export type SourceId = string;
export type Timestamp = number;
export type Confidence = number;

export interface Fact {
    sourceId: SourceId;
    timestamp: Timestamp;
    factPayload: Record<string, unknown>;
    confidence: Confidence;
}

export interface Conflict {
    ruleId: string;
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    factsInvolved: Fact[];
}

export type ConflictSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Rule {
    ruleId: string;
    checkFunction: (facts: Fact[]): Conflict[] | null;
    conflictSeverity: ConflictSeverity;
}

export interface ConsistencyReport {
    isConsistent: boolean;
    conflicts: Conflict[];
}

export class TemporalFactConsistencyValidator {
    validate(facts: Fact[], rules: Rule[]): ConsistencyReport {
        const allConflicts: Conflict[] = [];

        for (const rule of rules) {
            const conflicts = rule.checkFunction(facts);
            if (conflicts) {
                allConflicts.push(...conflicts);
            }
        }

        const isConsistent = allConflicts.length === 0;

        return {
            isConsistent,
            conflicts: allConflicts,
        };
    }
}