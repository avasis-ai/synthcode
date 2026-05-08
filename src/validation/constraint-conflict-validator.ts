import { Constraint, ConflictRule, ConflictSeverity } from "../types/constraint-types.js";

export class ConstraintConflictValidator {
    private conflictRules: Map<string, ConflictRule[]> = new Map();

    constructor() {
        this.initializeDefaultRules();
    }

    private initializeDefaultRules(): void {
        // Example: Resource vs Ethical conflict
        this.addConflictRule(
            Constraint.Resource,
            Constraint.Ethical,
            {
                severity: ConflictSeverity.HIGH,
                message: "Resource usage conflicts with ethical guidelines (e.g., excessive energy use).",
                suggestion: "Implement resource throttling or use alternative, lower-impact methods."
            }
        );

        // Example: Performance vs Resource conflict
        this.addConflictRule(
            Constraint.Performance,
            Constraint.Resource,
            {
                severity: ConflictSeverity.MEDIUM,
                message: "High performance requirements may exceed available resource limits.",
                suggestion: "Review performance targets or allocate more resources."
            }
        );

        // Example: Ethical vs Performance conflict
        this.addConflictRule(
            Constraint.Ethical,
            Constraint.Performance,
            {
                severity: ConflictSeverity.LOW,
                message: "Ethical considerations might introduce latency, impacting performance SLAs.",
                suggestion: "Optimize ethical checks for speed or define acceptable latency bounds."
            }
        );
    }

    private getPairKey(typeA: Constraint, typeB: Constraint): string {
        const sortedTypes = [typeA, typeB].sort((a, b) => a.toString().localeCompare(b.toString()));
        return `${sortedTypes[0]}:${sortedTypes[1]}`;
    }

    private addConflictRule(typeA: Constraint, typeB: Constraint, rule: ConflictRule): void {
        const key = this.getPairKey(typeA, typeB);
        if (!this.conflictRules.has(key)) {
            this.conflictRules.set(key, []);
        }
        this.conflictRules.get(key)!.push(rule);
    }

    /**
     * Validates a set of active constraints for inherent conflicts.
     * @param activeConstraints The list of constraints currently active in the plan.
     * @returns An array of detected conflicts.
     */
    public validate(activeConstraints: Constraint[]): ConflictConflict[] {
        const conflicts: ConflictConflict[] = [];
        const n = activeConstraints.length;

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const constraintA = activeConstraints[i];
                const constraintB = activeConstraints[j];

                const key = this.getPairKey(constraintA.type, constraintB.type);

                if (this.conflictRules.has(key)) {
                    const rules = this.conflictRules.get(key)!;
                    for (const rule of rules) {
                        // Simple implementation: assume all constraints of these types conflict
                        conflicts.push({
                            constraintA: constraintA,
                            constraintB: constraintB,
                            conflict: rule
                        });
                    }
                }
            }
        }
        return conflicts;
    }
}