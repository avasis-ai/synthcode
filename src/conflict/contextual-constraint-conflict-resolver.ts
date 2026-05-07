import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

interface Context {
    payload: Record<string, unknown>;
    history: Message[];
}

interface Constraint {
    id: string;
    type: "resource" | "temporal" | "capability" | "business";
    details: Record<string, any>;
    authority: number;
    description: string;
}

export interface Conflict {
    constraintId1: string;
    constraintId2: string;
    type: "resource_overlap" | "temporal_contradiction" | "capability_mismatch" | "business_rule_violation";
    message: string;
}

export interface ConstraintSet {
    constraints: Constraint[];
    conflictsDetected: Conflict[];
}

class ContextualConstraintConflictResolver {
    private context: Context;
    private constraints: Constraint[];

    constructor(context: Context, constraints: Constraint[]) {
        this.context = context;
        this.constraints = constraints;
    }

    private detectConflicts(constraints: Constraint[]): Conflict[] {
        const conflicts: Conflict[] = [];
        const n = constraints.length;

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const c1 = constraints[i];
                const c2 = constraints[j];

                // 1. Resource Overlap Check (Example: Two constraints demanding exclusive resource X)
                if (c1.type === "resource" && c2.type === "resource") {
                    const res1 = c1.details.resource_name as string;
                    const res2 = c2.details.resource_name as string;
                    if (res1 && res2 && res1 === res2 && (c1.details.limit as number) + (c2.details.limit as number) > 100) {
                        conflicts.push({
                            constraintId1: c1.id,
                            constraintId2: c2.id,
                            type: "resource_overlap",
                            message: `Resource ${res1} is over-allocated by both constraints.`
                        });
                    }
                }

                // 2. Temporal Contradiction Check (Example: Must happen before T1 vs Must happen after T2)
                if (c1.type === "temporal" && c2.type === "temporal") {
                    const start1 = c1.details.start_time as number;
                    const end2 = c2.details.end_time as number;
                    if (start1 !== undefined && end2 !== undefined && start1 > end2) {
                        conflicts.push({
                            constraintId1: c1.id,
                            constraintId2: c2.id,
                            type: "temporal_contradiction",
                            message: `Temporal conflict: Constraint ${c1.id} starts after Constraint ${c2.id} ends.`
                        });
                    }
                }

                // 3. Capability Mismatch Check (Example: One requires Tool A, the other forbids it)
                if (c1.type === "capability" && c2.type === "capability") {
                    const requiredTool1 = c1.details.required_tool as string;
                    const forbiddenTool2 = c2.details.forbidden_tool as string;
                    if (requiredTool1 && forbiddenTool2 && requiredTool1 === forbiddenTool2) {
                        conflicts.push({
                            constraintId1: c1.id,
                            constraintId2: c2.id,
                            type: "capability_mismatch",
                            message: `Capability conflict: Constraint ${c1.id} requires ${requiredTool1}, but Constraint ${c2.id} forbids it.`
                        });
                    }
                }
            }
        }
        return conflicts;
    }

    private resolveConflicts(conflicts: Conflict[], constraints: Constraint[]): Constraint[] {
        // Simple resolution strategy: Keep constraints with the highest authority,
        // and remove the conflicting constraint if its authority is lower than the conflict source's authority.

        const authorityMap = new Map<string, number>();
        constraints.forEach(c => authorityMap.set(c.id, c.authority));

        const resolvedConstraints: Set<string> = new Set(constraints.map(c => c.id));

        for (const conflict of conflicts) {
            const [id1, id2] = [conflict.constraintId1, conflict.constraintId2];
            const authority1 = authorityMap.get(id1) || 0;
            const authority2 = authorityMap.get(id2) || 0;

            if (authority1 < authority2) {
                resolvedConstraints.delete(id1);
            } else if (authority2 < authority1) {
                resolvedConstraints.delete(id2);
            }
            // If authorities are equal, we keep both for now, assuming the conflict detection
            // was only advisory, or we could implement a tie-breaker (e.g., keep the one related to the user).
        }

        return Array.from(resolvedConstraints).map(id => {
            return constraints.find(c => c.id === id)!;
        });
    }

    /**
     * Analyzes the context and a set of constraints to detect and resolve conflicts.
     * @returns A refined, non-conflicting ConstraintSet.
     */
    public resolve(constraints: Constraint[]): ConstraintSet {
        const detectedConflicts = this.detectConflicts(constraints);
        const refinedConstraints = this.resolveConflicts(detectedConflicts, constraints);

        return {
            constraints: refinedConstraints,
            conflictsDetected: detectedConflicts
        };
    }
}

export { ContextualConstraintConflictResolver };