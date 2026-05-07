import { Plan } from "./plan.js";
import { Context } from "./context.js";

interface PlanRiskReport {
    overallScore: number;
    costRisk: number;
    complianceRisk: number;
    noveltyRisk: number;
    resourceContentionRisk: number;
    recommendation: 'PROCEED' | 'REVIEW' | 'ABORT';
}

interface RiskScores {
    cost: number;
    compliance: number;
    novelty: number;
    resource: number;
}

class PlanRiskEvaluator {
    private readonly weightMap: Record<string, number> = {
        cost: 0.3,
        compliance: 0.3,
        novelty: 0.2,
        resource: 0.2,
    };

    constructor() {}

    private async calculateCostRisk(plan: Plan, context: Context): Promise<number> {
        let totalPredictedCost = 0;
        for (const step of plan.steps) {
            // Mock calculation: Assume cost is proportional to input size
            totalPredictedCost += Object.keys(step.input).length * 10;
        }

        const budgetRatio = totalPredictedCost / (context.currentBudget || 1);
        // Risk increases exponentially as we approach or exceed the budget
        return Math.min(1.0, Math.pow(budgetRatio, 0.5));
    }

    private async validateComplianceRisk(plan: Plan, context: Context): Promise<number> {
        let violationCount = 0;
        for (const step of plan.steps) {
            // Mock validation: Check for restricted tools
            if (step.toolName.toLowerCase().includes("restricted")) {
                violationCount++;
            }
        }
        // Risk is proportional to the number of violations
        return Math.min(1.0, violationCount * 0.3);
    }

    private async scoreNoveltyRisk(plan: Plan, context: Context): Promise<number> {
        let novelToolCount = 0;
        for (const step of plan.steps) {
            // Mock novelty check: Assume tools not in historical data are novel
            if (!context.historicalData[step.toolName]) {
                novelToolCount++;
            }
        }
        // Novelty risk increases with the number of unique, unproven tools
        return Math.min(1.0, novelToolCount * 0.25);
    }

    private async assessResourceContentionRisk(plan: Plan, context: Context): Promise<number> {
        // Mock assessment: Check for repeated calls to high-demand resources
        const resourceUsage = new Map<string, number>();
        for (const step of plan.steps) {
            const resource = step.toolName.split("Tool")[0];
            resourceUsage.set(resource, (resourceUsage.get(resource) || 0) + 1);
        }

        let contentionScore = 0;
        for (const count of resourceUsage.values()) {
            if (count > 2) {
                contentionScore += 0.15;
            }
        }
        return Math.min(1.0, contentionScore);
    }

    public async evaluate(plan: Plan, context: Context): Promise<PlanRiskReport> {
        const costRisk = await this.calculateCostRisk(plan, context);
        const complianceRisk = await this.validateComplianceRisk(plan, context);
        const noveltyRisk = await this.scoreNoveltyRisk(plan, context);
        const resourceContentionRisk = await this.assessResourceContentionRisk(plan, context);

        const weightedScore = this.calculateCompositeScore(
            costRisk,
            complianceRisk,
            noveltyRisk,
            resourceContentionRisk
        );

        let recommendation: 'PROCEED' | 'REVIEW' | 'ABORT' = 'PROCEED';
        if (weightedScore > 0.7) {
            recommendation = 'ABORT';
        } else if (weightedScore > 0.4) {
            recommendation = 'REVIEW';
        }

        return {
            overallScore: weightedScore,
            costRisk: costRisk,
            complianceRisk: complianceRisk,
            noveltyRisk: noveltyRisk,
            resourceContentionRisk: resourceContentionRisk,
            recommendation: recommendation,
        };
    }

    private calculateCompositeScore(
        cost: number,
        compliance: number,
        novelty: number,
        resource: number
    ): number {
        const weightedSum = (cost * this.weightMap.cost) +
                             (compliance * this.weightMap.compliance) +
                             (novelty * this.weightMap.novelty) +
                             (resource * this.weightMap.resource);
        return Math.min(1.0, weightedSum);
    }
}

export { PlanRiskEvaluator };