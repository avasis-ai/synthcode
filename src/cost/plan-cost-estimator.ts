import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type PlanStep = {
  description: string;
  requiredTokens: number;
  apiCalls: {
    name: string;
    quotaCost: number;
    usageEstimate: number;
  }[];
  computationalComplexity: 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n^2)';
  estimatedDurationMs: number;
  riskFactor: number;
};

export interface CostEstimateReport {
  totalCostUSD: number;
  totalTokens: number;
  totalComplexity: {
    complexityString: string;
    severityScore: number;
  };
  totalRiskScore: number;
  summary: string;
}

class PlanCostEstimator {
  private readonly TOKEN_COST_PER_MILLION: number = 0.0005;
  private readonly BASE_API_OVERHEAD_COST: number = 0.01;

  private estimateTokenCost(tokens: number): number {
    return (tokens / 1_000_000) * this.TOKEN_COST_PER_MILLION;
  }

  private estimateApiCost(apiCalls: {
    name: string;
    quotaCost: number;
    usageEstimate: number;
  }[]): number {
    let totalCost = 0;
    for (const call of apiCalls) {
      totalCost += call.quotaCost * (call.usageEstimate / 100);
    }
    return totalCost + this.BASE_API_OVERHEAD_COST;
  }

  private estimateComplexityScore(complexity: PlanStep['computationalComplexity']): number {
    switch (complexity) {
      case 'O(1)':
        return 1;
      case 'O(log n)':
        return 3;
      case 'O(n)':
        return 5;
      case 'O(n log n)':
        return 8;
      case 'O(n^2)':
        return 15;
      default:
        return 0;
    }
  }

  private estimateStepCost(step: PlanStep): {
    cost: number;
    tokens: number;
    complexityScore: number;
    riskScore: number;
  } {
    const tokenCost = this.estimateTokenCost(step.requiredTokens);
    const apiCost = this.estimateApiCost(step.apiCalls);
    const complexityScore = this.estimateComplexityScore(step.computationalComplexity);

    const totalCost = tokenCost + apiCost;
    const totalRiskScore = step.riskFactor * 10;

    return {
      cost: totalCost,
      tokens: step.requiredTokens,
      complexityScore: complexityScore,
      riskScore: totalRiskScore,
    };
  }

  estimatePlanCost(plan: PlanStep[]): CostEstimateReport {
    let totalCostUSD = 0;
    let totalTokens = 0;
    let totalComplexityScore = 0;
    let totalRiskScore = 0;

    for (const step of plan) {
      const estimate = this.estimateStepCost(step);
      totalCostUSD += estimate.cost;
      totalTokens += estimate.tokens;
      totalComplexityScore += estimate.complexityScore;
      totalRiskScore += estimate.riskScore;
    }

    const complexityString = plan.length > 0 ? plan[plan.length - 1].computationalComplexity : 'O(1)';

    const summary = `Plan estimated cost: $${totalCostUSD.toFixed(4)}. Total tokens: ${totalTokens}. Overall risk: ${totalRiskScore.toFixed(1)}.`;

    return {
      totalCostUSD: totalCostUSD,
      totalTokens: totalTokens,
      totalComplexity: {
        complexityString: complexityString,
        severityScore: totalComplexityScore,
      },
      totalRiskScore: totalRiskScore,
      summary: summary,
    };
  }
}

export { PlanCostEstimator };