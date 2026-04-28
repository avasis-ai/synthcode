import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface ModelPricing {
  getCost(modelName: string, inputTokens: number, outputTokens: number): { cost: number; tokens: { input: number; output: number } };
}

interface ToolUsageEstimator {
  estimateCost(toolName: string, input: Record<string, unknown>): { cost: number; tokens: { input: number; output: number } };
}

export interface CostProjectionRequest {
  toolCalls: {
    toolName: string;
    input: Record<string, unknown>;
  }[];
  llmPrompts: string[];
}

interface CostBreakdown {
  totalCost: number;
  toolCallCosts: {
    toolName: string;
    cost: number;
    tokens: { input: number; output: number };
  }[];
  llmCosts: {
    modelName: string;
    cost: number;
    tokens: { input: number; output: number };
  }[];
}

export class CostProjector {
  private pricingService: ModelPricing;
  private estimator: ToolUsageEstimator;

  constructor(pricingService: ModelPricing, estimator: ToolUsageEstimator) {
    this.pricingService = pricingService;
    this.estimator = estimator;
  }

  public projectCost(request: CostProjectionRequest): { totalCost: number; breakdown: CostBreakdown } {
    let totalCost = 0;
    const toolCallCosts: CostBreakdown["toolCallCosts"] = [];
    const llmCosts: CostBreakdown["llmCosts"] = [];

    // 1. Estimate Tool Call Costs
    for (const call of request.toolCalls) {
      const { cost, tokens } = this.estimator.estimateCost(call.toolName, call.input);
      toolCallCosts.push({
        toolName: call.toolName,
        cost: cost,
        tokens: tokens,
      });
      totalCost += cost;
    }

    // 2. Estimate LLM Interaction Costs (Assuming one model for simplicity)
    const modelName = "default-model";
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalLLMCost = 0;

    // Estimate cost for the initial prompt sequence
    for (const prompt of request.llmPrompts) {
      // Simplified token estimation: assume input tokens = prompt length, output tokens = 100 (placeholder)
      const inputTokens = prompt.length;
      const outputTokens = 100;
      const { cost: modelCost, tokens: modelTokens } = this.pricingService.getCost(modelName, inputTokens, outputTokens);

      llmCosts.push({
        modelName: modelName,
        cost: modelCost,
        tokens: { input: modelTokens.input, output: modelTokens.output },
      });
      totalLLMCost += modelCost;
      totalInputTokens += modelTokens.input;
      totalOutputTokens += modelTokens.output;
    }

    totalCost += totalLLMCost;

    const breakdown: CostBreakdown = {
      totalCost: totalCost,
      toolCallCosts: toolCallCosts,
      llmCosts: llmCosts,
    };

    return { totalCost, breakdown };
  }
}