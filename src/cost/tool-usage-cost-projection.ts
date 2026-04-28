import { PricingModel } from "./pricing-model";
import { ToolCallDefinition } from "./tool-call-definition";

export interface CostProjection {
  toolCalls: ToolCallDefinition[];
  pricingModel: PricingModel;
}

export interface StepCost {
  toolCall: ToolCallDefinition;
  estimatedCost: number;
  details: {
    toolCost: number;
    inputTokenCost: number;
    outputTokenCost: number;
  };
}

export class CostProjector {
  private readonly pricingModel: PricingModel;

  constructor(pricingModel: PricingModel) {
    this.pricingModel = pricingModel;
  }

  private estimateCost(toolCall: ToolCallDefinition): { estimatedCost: number; details: { toolCost: number; inputTokenCost: number; outputTokenCost: number; } } {
    const { toolName, input, estimatedInputTokens, estimatedOutputTokens } = toolCall;

    const toolCost = this.pricingModel.getToolCost(toolName);
    const inputTokenCost = this.pricingModel.getTokensCost(estimatedInputTokens, "input");
    const outputTokenCost = this.pricingModel.getTokensCost(estimatedOutputTokens, "output");

    const totalCost = toolCost + inputTokenCost + outputTokenCost;

    return {
      estimatedCost: totalCost,
      details: {
        toolCost: toolCost,
        inputTokenCost: inputTokenCost,
        outputTokenCost: outputTokenCost,
      },
    };
  }

  public projectCosts(projection: CostProjection): {
    steps: StepCost[];
    totalCost: number;
    mostExpensiveStep: StepCost | null;
  } {
    const { toolCalls } = projection;

    if (!toolCalls || toolCalls.length === 0) {
      return {
        steps: [],
        totalCost: 0,
        mostExpensiveStep: null,
      };
    }

    const steps: StepCost[] = [];
    let totalCost = 0;
    let mostExpensiveStep: StepCost | null = null;

    for (const toolCall of toolCalls) {
      const { estimatedCost, details } = this.estimateCost(toolCall);
      const step: StepCost = {
        toolCall: toolCall,
        estimatedCost: estimatedCost,
        details: details,
      };
      steps.push(step);
      totalCost += estimatedCost;

      if (!mostExpensiveStep || estimatedCost > mostExpensiveStep.estimatedCost) {
        mostExpensiveStep = step;
      }
    }

    return {
      steps,
      totalCost,
      mostExpensiveStep,
    };
  }
}