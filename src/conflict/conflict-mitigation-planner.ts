import { ConflictReport, MitigationPlan, MitigationStrategy, StrategyResult } from "./types";

class ConflictMitigationPlanner {
    private strategies: MitigationStrategy[] = [];

    constructor() {}

    registerStrategy(strategy: MitigationStrategy): void {
        this.strategies.push(strategy);
    }

    /**
     * Simulates the impact of all registered strategies on the given conflict report
     * and returns the best-ranked mitigation plan.
     * @param conflictReport The detailed report of the conflict.
     * @returns The optimal MitigationPlan.
     */
    planMitigation(conflictReport: ConflictReport): MitigationPlan {
        if (this.strategies.length === 0) {
            throw new Error("No mitigation strategies registered. Cannot plan.");
        }

        const results: StrategyResult[] = [];

        for (const strategy of this.strategies) {
            try {
                const result = strategy.simulate(conflictReport);
                results.push(result);
            } catch (e) {
                // Handle simulation failures gracefully
                console.error(`Failed to simulate strategy ${strategy.name}:`, e);
            }
        }

        if (results.length === 0) {
            return {
                plan: [],
                score: -1,
                summary: "Could not generate a viable plan based on available strategies."
            };
        }

        // Determine the best plan based on a composite scoring mechanism
        const bestResult = results.reduce((best, current) => {
            if (current.score > best.score) {
                return current;
            }
            return best;
        }, results[0]);

        return {
            plan: bestResult.actions,
            score: bestResult.score,
            summary: `Optimal plan found using ${bestResult.strategyName}. Predicted success probability: ${Math.round(bestResult.score * 100)}%`
        };
    }
}

export { ConflictMitigationPlanner };