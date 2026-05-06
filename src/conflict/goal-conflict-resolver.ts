import { Goal, Conflict, ConflictReport } from "./types";

export class GoalConflictResolver {
    constructor() {}

    /**
     * Detects conflicts among a list of goals and suggests a prioritized, merged set.
     * @param goals An array of high-level goals.
     * @returns A ConflictReport containing detected conflicts and suggested goals.
     */
    resolve(goals: Goal[]): ConflictReport {
        const conflicts: Conflict[] = [];
        const numGoals = goals.length;

        // 1. Detect all pairwise conflicts
        for (let i = 0; i < numGoals; i++) {
            for (let j = i + 1; j < numGoals; j++) {
                const goalA = goals[i];
                const goalB = goals[j];
                const detectedConflicts = this.detectPairConflict(goalA, goalB);
                conflicts.push(...detectedConflicts);
            }
        }

        // 2. Analyze and Merge Goals
        const mergedGoals = this.mergeGoals(goals, conflicts);

        return {
            conflicts: conflicts,
            mergedGoals: mergedGoals,
        };
    }

    /**
     * Detects conflicts between two specific goals based on predefined rules.
     * @param goalA The first goal.
     * @param goalB The second goal.
     * @returns An array of detected conflicts.
     */
    private detectPairConflict(goalA: Goal, goalB: Goal): Conflict[] {
        const conflicts: Conflict[] = [];

        // Rule 1: Resource Constraint Conflict (e.g., both require exclusive access to 'GPU')
        if (goalA.resourceNeeds.has("GPU") && goalB.resourceNeeds.has("GPU")) {
            conflicts.push({
                conflictingGoals: [goalA.name, goalB.name],
                conflictType: "Resource Contention",
                severity: 0.8,
                explanation: "Both goals require exclusive access to the GPU resource, which is a limited resource.",
            });
        }

        // Rule 2: Time Window Conflict (e.g., one needs immediate action, the other needs long setup)
        if (goalA.timeConstraints.includes("Immediate") && goalB.timeConstraints.includes("Long Setup")) {
            conflicts.push({
                conflictingGoals: [goalA.name, goalB.name],
                conflictType: "Temporal Conflict",
                severity: 0.7,
                explanation: "Goal A requires immediate action, but Goal B requires a long setup time, creating a scheduling conflict.",
            });
        }

        // Rule 3: Objective Conflict (e.g., Max Speed vs Perfect Accuracy)
        if ((goalA.objective === "Maximize Speed" && goalB.objective === "Ensure Perfect Accuracy") ||
            (goalB.objective === "Maximize Speed" && goalA.objective === "Ensure Perfect Accuracy")) {
            conflicts.push({
                conflictingGoals: [goalA.name, goalB.name],
                conflictType: "Objective Tradeoff",
                severity: 0.9,
                explanation: "Maximizing speed inherently compromises perfect accuracy. A trade-off must be explicitly chosen.",
            });
        }

        return conflicts;
    }

    /**
     * Generates a prioritized and merged set of goals by resolving detected conflicts.
     * This is a simplified heuristic approach.
     * @param goals The original list of goals.
     * @param conflicts The detected conflicts.
     * @returns The merged list of goals.
     */
    private mergeGoals(goals: Goal[], conflicts: Conflict[]): Goal[] {
        const uniqueGoals = goals.filter((goal, index) => {
            // Simple deduplication based on name/description
            return index === 0;
        });

        // Sort by priority (highest first)
        uniqueGoals.sort((a, b) => b.priority - a.priority);

        // In a real system, this would involve complex constraint satisfaction.
        // Here, we prioritize the highest-ranked goals and adjust their constraints
        // based on the most severe conflicts.
        const merged: Goal[] = [];

        for (const goal of uniqueGoals) {
            let adjustedGoal = { ...goal };

            // Check if this goal is involved in a high-severity conflict
            const highSeverityConflicts = conflicts.filter(c =>
                c.conflictingGoals.includes(goal.name) && c.severity >= 0.8
            );

            if (highSeverityConflicts.length > 0) {
                // Heuristic: If highly conflicted, adjust the objective to be more flexible
                if (adjustedGoal.objective === "Maximize Speed") {
                    adjustedGoal.objective = "Optimize Speed vs Accuracy";
                    adjustedGoal.description += " (Adjusted due to high conflict severity)";
                }
            }
            merged.push(adjustedGoal);
        }

        return merged;
    }
}