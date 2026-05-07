import { Goal, GoalConflictReport, ArbitrationStrategy, ArbitrationResult } from "./types";

export class GoalArbitrationEngine {
    private strategies: Map<string, ArbitrationStrategy>;

    constructor() {
        this.strategies = new Map();
    }

    registerStrategy(name: string, strategy: ArbitrationStrategy): void {
        this.strategies.set(name, strategy);
    }

    /**
     * Runs the arbitration process using a specified strategy.
     * @param goals The set of goals to resolve.
     * @param strategyName The name of the arbitration strategy to use.
     * @returns The resolved goal sequence and rationale.
     * @throws Error if the strategy is not registered.
     */
    arbitrateGoals(goals: Goal[], strategyName: string): ArbitrationResult {
        const strategy = this.strategies.get(strategyName);

        if (!strategy) {
            throw new Error(`Arbitration strategy "${strategyName}" is not registered.`);
        }

        const conflictReport: GoalConflictReport = this.generateConflictReport(goals);

        const resolvedGoal = strategy(goals, conflictReport);

        return {
            resolvedGoal: resolvedGoal,
            rationale: `Arbitration completed using the ${strategyName} strategy. Conflicts detected: ${conflictReport.conflicts.length}. The resulting unified goal prioritizes ${resolvedGoal.primaryFocus}.`,
            steps: this.decomposeGoal(resolvedGoal)
        };
    }

    /**
     * Generates a detailed report of potential conflicts between the given goals.
     * @param goals The goals to check for conflicts.
     * @returns A structured conflict report.
     */
    private generateConflictReport(goals: Goal[]): GoalConflictReport {
        const conflicts: { goalA: Goal; goalB: Goal; conflictType: string }[] = [];

        for (let i = 0; i < goals.length; i++) {
            for (let j = i + 1; j < goals.length; j++) {
                const goalA = goals[i];
                const goalB = goals[j];

                // Simple conflict detection logic based on keywords
                const keywordsA = goalA.description.toLowerCase();
                const keywordsB = goalB.description.toLowerCase();

                if (keywordsA.includes("minimize cost") && keywordsB.includes("maximize speed")) {
                    conflicts.push({
                        goalA: goalA,
                        goalB: goalB,
                        conflictType: "Cost vs Speed Tradeoff"
                    });
                }
                if (keywordsA.includes("safety") && keywordsB.includes("speed")) {
                    conflicts.push({
                        goalA: goalA,
                        goalB: goalB,
                        conflictType: "Safety vs Speed Conflict"
                    });
                }
            }
        }

        return {
            conflicts: conflicts,
            summary: `Identified ${conflicts.length} potential conflicts across ${goals.length} goals.`
        };
    }

    /**
     * Decomposes a high-level goal into a sequence of actionable sub-steps.
     * @param goal The resolved goal.
     * @returns An array of actionable steps.
     */
    private decomposeGoal(goal: Goal): string[] {
        if (goal.type === "SafetyCritical") {
            return ["Perform safety check", "Verify environmental parameters", "Execute primary task"];
        }
        if (goal.type === "Optimization") {
            return ["Analyze constraints", "Determine optimal path", "Execute path"];
        }
        return [`Achieve ${goal.name}`, `Monitor progress`, `Finalize objective`];
    }
}

// --- Type Definitions (Mocking the necessary structure for completeness) ---

export interface Goal {
    name: string;
    description: string;
    priority: number;
    type: "SafetyCritical" | "Optimization" | "General";
    primaryFocus: string;
}

export interface GoalConflictReport {
    conflicts: { goalA: Goal; goalB: Goal; conflictType: string }[];
    summary: string;
}

export interface ArbitrationResult {
    resolvedGoal: Goal;
    rationale: string;
    steps: string[];
}

export type ArbitrationStrategy = (goals: Goal[], report: GoalConflictReport) => Goal;

// --- Example Strategies ---

/**
 * Strategy that always prioritizes safety above all else.
 */
export const SafetyFirstStrategy: ArbitrationStrategy = (goals, report) => {
    let resolvedGoal: Goal = {
        name: "Safe Operation",
        description: "Ensure all actions maintain maximum safety margins, even if it compromises speed or cost.",
        priority: 10,
        type: "SafetyCritical",
        primaryFocus: "Safety"
    };

    if (report.conflicts.some(c => c.conflictType.includes("Safety"))) {
        resolvedGoal.description += " (Safety conflict detected, enforcing safety protocols.)";
    }

    return resolvedGoal;
};

/**
 * Strategy that aims for the best balance between cost and performance.
 */
export const CostBenefitStrategy: ArbitrationStrategy = (goals, report) => {
    let resolvedGoal: Goal = {
        name: "Balanced Execution",
        description: "Achieve the objective using the most cost-effective method while maintaining acceptable performance levels.",
        priority: 7,
        type: "Optimization",
        primaryFocus: "Efficiency"
    };

    if (report.conflicts.some(c => c.conflictType.includes("Cost vs Speed"))) {
        resolvedGoal.description += " (Balancing cost and speed trade-offs.)";
    }

    return resolvedGoal;
};