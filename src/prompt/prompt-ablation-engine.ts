import { Message, ContentBlock, TextBlock } from "./types";

export interface PromptVariant {
  name: string;
  template: string;
  weights: {
    successRate: number;
    costEfficiency: number;
    constraintAdherence: number;
  };
}

export interface TestContext {
  history: Message[];
  contextData: Record<string, any>;
}

export interface TestResult {
  variantName: string;
  rawOutput: string;
  metrics: {
    successRate: number;
    cost: number;
    constraintAdherence: number;
  };
}

export class PromptAblationEngine {
  constructor() {}

  /**
   * Simulates an LLM call using a given prompt and context.
   * In a real application, this would call an external API (e.g., OpenAI, Anthropic).
   * @param prompt The prompt template to use.
   * @param context The test context data.
   * @returns A simulated TestResult.
   */
  private simulateLlmCall(prompt: string, context: TestContext): TestResult {
    // Mock logic: Simulate varying performance based on prompt length/content
    const baseScore = prompt.length * 0.01;
    const successRate = Math.min(1.0, 0.5 + baseScore + Math.random() * 0.2);
    const cost = Math.max(0.1, 1.0 - (prompt.length / 500));
    const adherence = Math.min(1.0, 0.6 + (prompt.length % 10) / 20);

    return {
      variantName: "simulated",
      rawOutput: `[Simulated response based on prompt: ${prompt.substring(0, 30)}...]`,
      metrics: {
        successRate: successRate,
        cost: cost,
        constraintAdherence: adherence,
      },
    };
  }

  /**
   * Runs all prompt variants against the given context and collects results.
   * @param variants List of prompt variants to test.
   * @param context The test context.
   * @returns Array of TestResult for each variant.
   */
  public runAblation(variants: PromptVariant[], context: TestContext): TestResult[] {
    return variants.map(variant => {
      const fullPrompt = this.applyTemplate(variant.template, context);
      const result = this.simulateLlmCall(fullPrompt, context);
      return {
        ...result,
        variantName: variant.name,
        metrics: {
          ...result.metrics,
          successRate: result.metrics.successRate * variant.weights.successRate,
          cost: result.metrics.cost * variant.weights.costEfficiency,
          constraintAdherence: result.metrics.constraintAdherence * variant.weights.constraintAdherence,
        }
      };
    });
  }

  /**
   * Applies context data to the prompt template.
   * @param template The raw prompt template string.
   * @param context The context data.
   * @returns The fully rendered prompt string.
   */
  private applyTemplate(template: string, context: TestContext): string {
    let prompt = template;
    if (context.contextData) {
      Object.keys(context.contextData).forEach(key => {
        const value = context.contextData[key];
        const placeholder = new RegExp(`\\{\{${key}\\}\\}`, 'g');
        prompt = prompt.replace(placeholder, String(value));
      });
    }
    return prompt;
  }

  /**
   * Calculates a weighted score for a single test result.
   * Score = (W_success * Success) + (W_cost * Cost) + (W_adherence * Adherence)
   * @param result The test result.
   * @param weights The weights defining the importance of each metric.
   * @returns The aggregated score.
   */
  public scoreResult(result: TestResult, weights: { successRate: number; cost: number; constraintAdherence: number }): number {
    const { successRate, cost, constraintAdherence } = result.metrics;
    return (
      weights.successRate * successRate +
      weights.cost * cost +
      weights.constraintAdherence * constraintAdherence
    );
  }

  /**
   * Analyzes the results and recommends the optimal prompt variant.
   * @param results Array of test results.
   * @param weights Weights used for scoring.
   * @returns The name of the best performing prompt variant.
   */
  public recommendBestPrompt(results: TestResult[], weights: { successRate: number; cost: number; constraintAdherence: number }): { bestVariantName: string; score: number } {
    let bestScore = -Infinity;
    let bestVariantName = "";

    for (const result of results) {
      const score = this.scoreResult(result, weights);
      if (score > bestScore) {
        bestScore = score;
        bestVariantName = result.variantName;
      }
    }

    return { bestVariantName, score: bestScore };
  }
}