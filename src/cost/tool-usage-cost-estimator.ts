import { Message, ToolUseBlock } from "./types";

export interface ToolCostEstimator {
  baseCost: number;
  inputTokenEstimate: (input: Record<string, unknown>) => number;
  outputTokenEstimate: (output: Record<string, unknown>) => number;
}

export interface ToolCallPlan {
  toolName: string;
  input: Record<string, unknown>;
  toolDefinition: ToolCostEstimator;
}

export interface CostReport {
  totalCost: number;
  breakdown: {
    toolName: string;
    cost: number;
    inputTokens: number;
    outputTokens: number;
  }[];
}

export class ToolUsageCostEstimator {
  private toolDefinitions: Map<string, ToolCostEstimator>;

  constructor(toolDefinitions: Record<string, ToolCostEstimator>) {
    this.toolDefinitions = new Map(
      Object.entries(toolDefinitions).map(([name, definition]) => [name, definition])
    );
  }

  private estimateToolCost(plan: ToolCallPlan): { cost: number; inputTokens: number; outputTokens: number } {
    const definition = plan.toolDefinition;
    const inputTokens = definition.inputTokenEstimate(plan.input);
    const outputTokens = definition.outputTokenEstimate(plan.input);
    const cost = definition.baseCost + (inputTokens * 0.001) + (outputTokens * 0.001); // Simplified pricing model
    return { cost, inputTokens, outputTokens };
  }

  public estimateTotalCost(plan: ToolCallPlan[]): CostReport {
    let totalCost = 0;
    const breakdown: CostReport["breakdown"] = [];

    for (const toolCall of plan) {
      if (!this.toolDefinitions.has(toolCall.toolName)) {
        throw new Error(`Unknown tool name: ${toolCall.toolName}`);
      }

      const { cost, inputTokens, outputTokens } = this.estimateToolCost(toolCall);

      totalCost += cost;

      breakdown.push({
        toolName: toolCall.toolName,
        cost: cost,
        inputTokens: inputTokens,
        outputTokens: outputTokens,
      });
    }

    return { totalCost, breakdown };
  }
}