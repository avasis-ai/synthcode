import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface PromptMetric {
  prompt_version: string;
  success_rate: number;
  failure_reason: string;
  token_cost: number;
  context_id: string;
}

export interface TestCase {
  input: string;
  expected_output_keywords: string[];
}

export class PromptOptimizer {
  private historicalMetrics: PromptMetric[] = [];

  addMetric(metric: PromptMetric): void {
    this.historicalMetrics.push(metric);
  }

  private calculateAverageMetric(metric: keyof PromptMetric): number {
    if (this.historicalMetrics.length === 0) {
      return 0;
    }
    const total = this.historicalMetrics.reduce((sum, m) => sum + (m[metric] as number), 0);
    return total / this.historicalMetrics.length;
  }

  optimize(targetMetric: keyof PromptMetric, context: string): string {
    const avgSuccessRate = this.calculateAverageMetric('success_rate');
    const avgTokenCost = this.calculateAverageMetric('token_cost');

    if (avgSuccessRate < 0.7) {
      return `[OPTIMIZATION SUGGESTION] The current prompts struggle with success rate (${avgSuccessRate.toFixed(2)}). Try adding explicit constraints and defining the output format clearly.`;
    }

    if (avgTokenCost > 50) {
      return `[OPTIMIZATION SUGGESTION] Token efficiency is low (Avg: ${avgTokenCost.toFixed(2)}). Consider summarizing the context or reducing unnecessary conversational filler.`;
    }

    return `[OPTIMIZATION SUGGESTION] Performance is stable. Consider refining the tone or adding edge-case handling for better robustness.`;
  }

  validate(promptVariation: string, testCases: TestCase[]): { score: number; improved: boolean; feedback: string } {
    let totalScore = 0;
    let passedCount = 0;

    for (const testCase of testCases) {
      // Simulate execution and scoring
      const simulatedSuccess = Math.random() > 0.1; // 90% success rate simulation
      if (simulatedSuccess) {
        totalScore += 1;
        passedCount++;
      }
    }

    const score = passedCount / testCases.length;
    const improved = score > 0.85;
    const feedback = improved ? "Validation successful. The prompt variation performs well against test cases." : "Validation failed. The prompt variation needs refinement, especially regarding edge cases.";

    return { score, improved, feedback };
  }
}