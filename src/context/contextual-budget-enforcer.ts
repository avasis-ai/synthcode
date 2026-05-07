import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface ContextBudget {
  maxTokens: number;
  maxCost: number;
  calculateUsage: (context: Message[]) => {
    tokens: number;
    cost: number;
  };
}

export class ContextualBudgetEnforcer {
  private budget: ContextBudget;
  private readonly relevanceWeights: Record<string, number>;

  constructor(budget: ContextBudget, relevanceWeights: Record<string, number> = {}) {
    this.budget = budget;
    this.relevanceWeights = relevanceWeights;
  }

  private calculateChunkUsage(message: Message): {
    tokens: number;
    cost: number;
    relevanceScore: number;
  } {
    let tokens = 0;
    let cost = 0;
    let relevanceScore = 0;

    if (message.role === "user") {
      tokens = message.content.length * 1.5;
      cost = 0.001;
      relevanceScore = this.relevanceWeights["user"] || 1.0;
    } else if (message.role === "assistant") {
      let contentTokens = 0;
      let contentCost = 0;
      
      message.content.forEach((block) => {
        if (block.type === "text") {
          contentTokens += block.text.length * 1.5;
          contentCost += 0.0005;
        }
      });
      
      tokens = contentTokens;
      cost = contentCost;
      relevanceScore = this.relevanceWeights["assistant"] || 1.0;
    } else if (message.role === "tool") {
      tokens = 50;
      cost = 0.002;
      relevanceScore = this.relevanceWeights["tool"] || 0.8;
    }

    return { tokens, cost, relevanceScore };
  }

  analyzeContext(context: Message[]): {
    currentUsage: { tokens: number; cost: number };
    relevanceScores: number[];
  } {
    let totalTokens = 0;
    let totalCost = 0;
    const relevanceScores: number[] = [];

    for (const message of context) {
      const usage = this.calculateChunkUsage(message);
      totalTokens += usage.tokens;
      totalCost += usage.cost;
      relevanceScores.push(usage.relevanceScore);
    }

    return {
      currentUsage: { tokens: totalTokens, cost: totalCost },
      relevanceScores: relevanceScores,
    };
  }

  prune(context: Message[]): Message[] {
    let currentContext = [...context];
    let usage = this.analyzeContext(currentContext).currentUsage;

    while (usage.tokens > this.budget.maxTokens || usage.cost > this.budget.maxCost) {
      if (currentContext.length <= 1) {
        break;
      }

      const { relevanceScores } = this.analyzeContext(currentContext);
      
      // Find the index of the least relevant message
      let minRelevance = Infinity;
      let pruneIndex = -1;

      for (let i = 0; i < relevanceScores.length; i++) {
        if (relevanceScores[i] < minRelevance) {
          minRelevance = relevanceScores[i];
          pruneIndex = i;
        }
      }

      if (pruneIndex === -1) {
        break;
      }

      // Prune the message at the lowest relevance score
      currentContext = currentContext.filter((_, index) => index !== pruneIndex);
      
      // Recalculate usage for the next iteration
      usage = this.analyzeContext(currentContext).currentUsage;
    }

    return currentContext;
  }
}