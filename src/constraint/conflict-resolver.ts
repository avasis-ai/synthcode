type ConstraintId = string;
type ConstraintType = "ResourceLimit" | "SecurityPolicy" | "TemporalRequirement" | "General";

export interface Constraint {
    id: ConstraintId;
    type: ConstraintType;
    description: string;
    rules: Record<string, any>;
    priority: number; // Higher number means higher priority
}

export interface Conflict {
    constraintAId: ConstraintId;
    constraintBId: ConstraintId;
    conflictType: string;
    details: string;
}

export interface ConflictReport {
    conflicts: Conflict[];
    summary: string;
    recommendation: string;
}

export type ConflictResolutionStrategy = "PrioritizeSecurity" | "MinimizeCost" | "FirstWins";

export class ConstraintConflictResolver {
    private constraints: Constraint[];
    private strategy: ConflictResolutionStrategy;

    constructor(constraints: Constraint[], strategy: ConflictResolutionStrategy) {
        this.constraints = constraints;
        this.strategy = strategy;
    }

    private detectConflicts(constraints: Constraint[]): Conflict[] {
        const conflicts: Conflict[] = [];
        const n = constraints.length;

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const c1 = constraints[i];
                const c2 = constraints[j];

                // Simple conflict detection logic based on type overlap and conflicting rules
                if (c1.type === "SecurityPolicy" && c2.type === "ResourceLimit") {
                    if (c1.rules.requiredAccess && c2.rules.maxUsage) {
                        conflicts.push({
                            constraintAId: c1.id,
                            constraintBId: c2.id,
                            conflictType: "Security vs Resource",
                            details: `Security policy requires access (${c1.rules.requiredAccess}), but resource limit (${c2.rules.maxUsage}) might restrict it.`
                        });
                    }
                }
                if (c1.type === "TemporalRequirement" && c2.type === "SecurityPolicy") {
                    if (c1.rules.timeWindow && c2.rules.requiredTime) {
                        conflicts.push({
                            constraintAId: c1.id,
                            constraintBId: c2.id,
                            conflictType: "Temporal vs Security",
                            details: `Time window (${c1.rules.timeWindow}) conflicts with required security window (${c2.rules.requiredTime}).`
                        });
                    }
                }
            }
        }
        return conflicts;
    }

    private applyStrategy(conflicts: Conflict[], constraints: Constraint[]): Constraint[] {
        const resolvedConstraints: Set<ConstraintId> = new Set();

        if (this.strategy === "PrioritizeSecurity") {
            const securityConstraints = constraints.filter(c => c.type === "SecurityPolicy");
            const remainingConstraints = constraints.filter(c => c.type !== "SecurityPolicy");

            // Keep all security constraints, and only keep non-conflicting resource/temporal ones
            for (const c of securityConstraints) {
                resolvedConstraints.add(c.id);
            }

            for (const c of remainingConstraints) {
                let isConflicting = false;
                for (const conflict of conflicts) {
                    if ((conflict.constraintAId === c.id || conflict.constraintBId === c.id) &&
                        (conflict.constraintAId !== securityConstraints[0].id && conflict.constraintBId !== securityConstraints[0].id)) {
                        isConflicting = true;
                        break;
                    }
                }
                if (!isConflicting) {
                    resolvedConstraints.add(c.id);
                }
            }
        } else if (this.strategy === "MinimizeCost") {
            // Keep constraints with the highest priority/lowest cost impact
            const sortedConstraints = [...constraints].sort((a, b) => b.priority - a.priority);
            const resolvedIds = new Set<ConstraintId>();

            for (const constraint of sortedConstraints) {
                // Simple heuristic: if it's high priority, keep it unless it conflicts with an even higher priority one (handled by sort)
                resolvedIds.add(constraint.id);
            }
            return constraints.filter(c => resolvedIds.has(c.id));

        } else if (this.strategy === "FirstWins") {
            // Keep the constraints in the order they were provided
            return constraints;
        }

        return constraints;
    }

    public resolve(constraints: Constraint[]): { resolvedConstraints: Constraint[]; report: ConflictReport } {
        const conflicts = this.detectConflicts(constraints);
        const resolvedConstraints = this.applyStrategy(conflicts, constraints);

        const summary = `Detected ${conflicts.length} conflicts using the ${this.strategy} strategy.`;
        let recommendation = "Review the conflicts report for specific adjustments.";

        if (this.strategy === "PrioritizeSecurity") {
            recommendation = "Security constraints were prioritized. Review resource limits that might have been dropped.";
        } else if (this.strategy === "MinimizeCost") {
            recommendation = "Constraints were kept based on highest defined priority.";
        }

        const report: ConflictReport = {
            conflicts: conflicts,
            summary: summary,
            recommendation: recommendation
        };

        return {
            resolvedConstraints: resolvedConstraints,
            report: report
        };
    }
}

export { ConstraintConflictResolver, ConflictReport, ConflictResolutionStrategy, Constraint };