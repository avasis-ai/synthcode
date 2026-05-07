import { CostCalculator } from "./cost-calculator.js";
import { HypotheticalExecutor } from "./hypothetical-executor.js";
import { ConflictResolver } from "./conflict-resolver.js";

export interface Hypothesis {
    plan: any;
    context: Record<string, unknown>;
}

export interface PredictedState {
    stateUpdates: Record<string, any>;
    finalState: any;
}

export interface ResourceUsage {
    cost: number;
    resources: Record<string, number>;
}

export interface HypothesisReport {
    success: boolean;
    predictedState: PredictedState;
    resourceUsage: ResourceUsage;
    conflictsDetected: boolean;
    confidenceScore: number;
    summary: string;
}

export class HypothesisManager {
    private executor: HypotheticalExecutor;
    private costCalculator: CostCalculator;
    private conflictResolver: ConflictResolver;

    constructor(
        executor: HypotheticalExecutor,
        costCalculator: CostCalculator,
        conflictResolver: ConflictResolver
    ) {
        this.executor = executor;
        this.costCalculator = costCalculator;
        this.conflictResolver = conflictResolver;
    }

    public runHypothesis(hypothesis: Hypothesis): HypothesisReport {
        try {
            const predictedState = this.executor.simulate(hypothesis.plan, hypothesis.context);
            const resourceUsage = this.costCalculator.calculate(hypothesis.plan, hypothesis.context);
            const conflictsDetected = this.conflictResolver.check(predictedState.finalState, hypothesis.context);

            let confidenceScore = 1.0;
            let summary = "Hypothesis simulation successful.";

            if (conflictsDetected) {
                confidenceScore *= 0.7;
                summary = "Warning: Potential conflicts detected. Review plan carefully.";
            }

            if (resourceUsage.cost > 100) {
                confidenceScore *= 0.8;
                summary = "Warning: High resource cost predicted. Consider optimization.";
            }

            const report: HypothesisReport = {
                success: true,
                predictedState: predictedState,
                resourceUsage: resourceUsage,
                conflictsDetected: conflictsDetected,
                confidenceScore: Math.max(0.0, confidenceScore),
                summary: summary
            };

            return report;

        } catch (error) {
            return {
                success: false,
                predictedState: { stateUpdates: {}, finalState: null },
                resourceUsage: { cost: 0, resources: {} },
                conflictsDetected: true,
                confidenceScore: 0.0,
                summary: `Simulation failed due to execution error: ${(error as Error).message}`
            };
        }
    }
}