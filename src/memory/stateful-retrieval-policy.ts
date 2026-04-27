import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface StateContext {
  lastToolCall?: {
    name: string;
    input: Record<string, unknown>;
  };
  currentGoal?: string;
  // Add other context fields as needed, e.g., active domain, session ID
}

export interface Policy<T> {
  apply(query: string, context: StateContext, items: T[]): T[];
}

export class StatefulRetriever implements Policy<any> {
  private readonly contextBoostFactor: number;

  constructor(contextBoostFactor: number = 0.5) {
    this.contextBoostFactor = contextBoostFactor;
  }

  private calculateContextScore(memoryContent: string, context: StateContext): number {
    let score = 0;

    if (context.lastToolCall) {
      const toolName = context.lastToolCall.name;
      const toolInputJson = JSON.stringify(context.lastToolCall.input);
      const lowerCaseContent = memoryContent.toLowerCase();

      if (lowerCaseContent.includes(toolName.toLowerCase())) {
        score += 0.3;
      }
      if (lowerCaseContent.includes(toolInputJson.toLowerCase())) {
        score += 0.2;
      }
    }

    if (context.currentGoal) {
      const goalLower = context.currentGoal.toLowerCase();
      if (memoryContent.toLowerCase().includes(goalLower)) {
        score += 0.4;
      }
    }

    return score;
  }

  public apply(query: string, context: StateContext, items: any[]): any[] {
    const scoredItems = items.map((item: any) => {
      const memoryContent = item.content || "";
      const contextScore = this.calculateContextScore(memoryContent, context);
      // Simulate original similarity score (assuming item has a 'score' property)
      const originalScore = item.score || 0;
      
      // Re-ranking logic: Boost score based on context match
      const finalScore = originalScore + (contextScore * this.contextBoostFactor);
      
      return {
        ...item,
        finalScore: finalScore,
        contextBoost: contextScore
      };
    });

    // Sort by the newly calculated final score in descending order
    scoredItems.sort((a, b) => b.finalScore - a.finalScore);

    // Return only the top N items or the sorted list, depending on the policy requirement.
    // Here, we return the sorted list.
    return scoredItems;
  }
}