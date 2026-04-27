import { ToolDefinition, ToolCall } from "./tool-definitions";

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

export class ToolUsageCostEstimator {
  private readonly toolDefinitions: ToolDefinition[];
  private readonly defaultOutputMultiplier: number;

  constructor(toolDefinitions: ToolDefinition[], defaultOutputMultiplier: number = 10) {
    this.toolDefinitions = toolDefinitions;
    this.defaultOutputMultiplier = defaultOutputMultiplier;
  }

  private estimateInputCost(toolCall: ToolCall): number {
    const inputString = JSON.stringify(toolCall.input);
    // Simple heuristic: count characters as tokens for estimation
    return Math.ceil(inputString.length / 4);
  }

  private estimateOutputCost(toolCall: ToolCall): number {
    // In a real system, this would analyze the schema of the tool's return type.
    // Here, we use a configurable multiplier based on complexity assumption.
    return Math.max(1, Math.round(this.defaultOutputMultiplier * (1 + toolCall.input.length / 10)));
  }

  estimateCost(toolCalls: ToolCall[]): CostEstimate {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (const call of toolCalls) {
      totalInputTokens += this.estimateInputCost(call);
      totalOutputTokens += this.estimateOutputCost(call);
    }

    return {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      totalCost: totalInputTokens + totalOutputTokens,
    };
  }
}