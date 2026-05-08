export interface ExternalGoal {
    goalId: string;
    sourceId: string;
    content: string;
    timestamp: number;
    initialCredibility: number;
}

export interface ProcessedGoal {
    goalId: string;
    content: string;
    finalWeight: number;
    sourceId: string;
}

export interface ProcessedGoalSet {
    goals: ProcessedGoal[];
    overallConfidenceScore: number;
}

export class GoalStreamProcessor {

    private readonly MAX_TIME_DECAY_SECONDS: number = 3600;
    private readonly BASE_CREDIBILITY_WEIGHT: number = 0.6;
    private readonly TEMPORAL_WEIGHT: number = 0.4;

    private calculateTemporalDecay(timestamp: number): number {
        const timeDifference = Math.abs(Date.now() - timestamp);
        const decayFactor = Math.exp(-(timeDifference / (this.MAX_TIME_DECAY_SECONDS * 1000)));
        return Math.max(0.1, decayFactor);
    }

    private calculateGoalWeight(goal: ExternalGoal): number {
        const temporalWeight = this.calculateTemporalDecay(goal.timestamp);
        const combinedWeight = (goal.initialCredibility * this.BASE_CREDIBILITY_WEIGHT) + (temporalWeight * this.TEMPORAL_WEIGHT);
        return Math.min(1.0, combinedWeight);
    }

    private resolveConflicts(goals: ExternalGoal[]): ProcessedGoal[] {
        const uniqueGoalsMap = new Map<string, ExternalGoal[]>();

        for (const goal of goals) {
            if (!uniqueGoalsMap.has(goal.goalId)) {
                uniqueGoalsMap.set(goal.goalId, []);
            }
            uniqueGoalsMap.get(goal.goalId)!.push(goal);
        }

        const resolvedGoals: ProcessedGoal[] = [];

        for (const [goalId, conflictingGoals] of uniqueGoalsMap.entries()) {
            let totalWeight = 0;
            let representativeGoal: ExternalGoal | undefined = undefined;

            for (const goal of conflictingGoals) {
                const weight = this.calculateGoalWeight(goal);
                totalWeight += weight;
                if (!representativeGoal || weight > this.calculateGoalWeight(representativeGoal)) {
                    representativeGoal = goal;
                }
            }

            const finalWeight = totalWeight / conflictingGoals.length;

            resolvedGoals.push({
                goalId: goalId,
                content: conflictingGoals.map(g => g.content).join(" | "),
                finalWeight: finalWeight,
                sourceId: representativeGoal?.sourceId || "unknown",
            });
        }

        return resolvedGoals;
    }

    public processStream(stream: ExternalGoal[]): ProcessedGoalSet {
        if (!stream || stream.length === 0) {
            return { goals: [], overallConfidenceScore: 0 };
        }

        const resolvedGoals = this.resolveConflicts(stream);

        const totalConfidenceScore = resolvedGoals.reduce((sum, goal) => sum + goal.finalWeight, 0);

        return {
            goals: resolvedGoals,
            overallConfidenceScore: Math.min(1.0, totalConfidenceScore / resolvedGoals.length),
        };
    }
}

export { GoalStreamProcessor };