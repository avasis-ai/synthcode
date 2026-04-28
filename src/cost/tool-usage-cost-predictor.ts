import { CostCalculator } from "./cost-calculator";
import { ModelPricing } from "./model-pricing";

export type ToolCallPlan = {
  toolCalls: {
    name: string;
    input: Record<string, unknown>;
  }[];
  messages: Message[];
};

export interface CostEstimate {
  totalCost: number;
  breakdown: {
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }[];
}

export class ToolUsageCostPredictor {
  private costCalculator: CostCalculator;
  private modelPricing: ModelPricing;

  constructor(costCalculator: CostCalculator, modelPricing: ModelPricing) {
    this.costCalculator = costCalculator;
    this.modelPricing = modelPricing;
  }

  private estimateToolCallTokens(toolCalls: { name: string; input: Record<string, unknown>; }[]): { inputTokens: number; outputTokens: number } {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (const toolCall of toolCalls) {
      // Estimate input tokens for the tool call arguments
      const inputString = JSON.stringify(toolCall.input);
      const inputTokenEstimate = Math.ceil(inputString.length / 4); // Simple heuristic
      totalInputTokens += inputTokenEstimate;

      // Assume a fixed, small output token estimate for the tool result placeholder
      totalOutputTokens += 5;
    }

    return { inputTokens: totalInputTokens, outputTokens: totalOutputTokens };
  }

  private estimateMessageTokens(messages: Message[]): { inputTokens: number; outputTokens: number } {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (const message of messages) {
      if (message.role === "user") {
        const contentString = message.content;
        totalInputTokens += Math.ceil(contentString.length / 4);
      } else if (message.role === "assistant") {
        // Estimate tokens from content blocks (simplified)
        let contentString = "";
        for (const block of message.content) {
          if (block.type === "text") {
            contentString += block.text;
          }
        }
        totalOutputTokens += Math.ceil(contentString.length / 4);
      } else if (message.role === "tool") {
        // Tool result content estimation
        totalOutputTokens += Math.ceil(message.content.length / 4);
      }
    }
    return { inputTokens: totalInputTokens, outputTokens: totalOutputTokens };
  }

  public predictCost(plan: ToolCallPlan): CostEstimate {
    const { toolCalls, messages } = plan;

    // 1. Estimate tokens from tool calls (input/output placeholders)
    const toolTokenEstimate = this.estimateToolCallTokens(toolCalls);

    // 2. Estimate tokens from existing message history
    const messageTokenEstimate = this.estimateMessageTokens(messages);

    // 3. Combine estimates for the final LLM interaction (Tool Call Request + Response Generation)
    // Input to LLM: History + Tool Call definitions
    const llmInputTokens = messageTokenEstimate.inputTokens + toolTokenEstimate.inputTokens;
    // Output from LLM: Final response generation
    const llmOutputTokens = messageTokenEstimate.outputTokens + toolTokenEstimate.outputTokens;

    // 4. Calculate costs using the underlying services
    const historyCost = this.costCalculator.calculate(
      "history",
      llmInputTokens,
      0,
      "gpt-3.5-turbo" // Assuming a base model for history context
    );

    const toolCallCost = this.costCalculator.calculate(
      "tool_calls",
      toolTokenEstimate.inputTokens,
      toolTokenEstimate.outputTokens,
      "gpt-4-turbo" // Assuming a model for tool calling logic
    );

    const finalResponseCost = this.costCalculator.calculate(
      "response",
      0,
      llmOutputTokens,
      "gpt-3.5-turbo" // Assuming a model for the final response
    );

    const totalCost = historyCost + toolCallCost + finalResponseCost;

    return {
      totalCost: totalCost,
      breakdown: [
        {
          modelName: "History Context",
          inputTokens: messageTokenEstimate.inputTokens,
          outputTokens: 0,
          cost: historyCost,
        },
        {
          modelName: "Tool Calling Logic",
          inputTokens: toolTokenEstimate.inputTokens,
          outputTokens: toolTokenEstimate.outputTokens,
          cost: toolCallCost,
        },
        {
          modelName: "Final Response Generation",
          inputTokens: 0,
          outputTokens: llmOutputTokens,
          cost: finalResponseCost,
        },
      ],
    };
  }
}