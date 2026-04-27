import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

interface SelectionContext {
  history: Message[];
  goal: string;
  availableTools: ToolDefinition[];
}

interface ScoredTool {
  tool: ToolDefinition;
  score: number;
}

export class AdaptiveToolSelector {
  private readonly embeddingModel: (text: string) => number[];

  constructor(embeddingModel: (text: string) => number[]) {
    this.embeddingModel = embeddingModel;
  }

  private calculateSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) {
      return 0;
    }
    let dotProduct = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
    }
    // Assuming normalized vectors for cosine similarity approximation
    return Math.sqrt(vecA.length) * Math.sqrt(vecB.length) / (Math.sqrt(vecA.length) * Math.sqrt(vecB.length)) * dotProduct;
  }

  private scoreTool(context: SelectionContext, tool: ToolDefinition): { tool: ToolDefinition; score: number } {
    const queryEmbedding = this.embeddingModel(context.goal);
    const descriptionEmbedding = this.embeddingModel(tool.description);

    // 1. Goal Similarity Score
    let score = this.calculateSimilarity(queryEmbedding, descriptionEmbedding);

    // 2. Contextual Relevance (Simple check based on history content)
    let contextScore = 0;
    const historyText = context.history.map(msg => {
      if (msg.role === "user") return (msg as UserMessage).content;
      if (msg.role === "assistant") return (msg as AssistantMessage).content.map(block => {
        if (block.type === "text") return (block as TextBlock).text;
        return "";
      }).join(" ");
      if (msg.role === "tool") return (msg as ToolResultMessage).content;
      return "";
    }).filter(Boolean).join(" ");

    if (context.history.length > 0 && context.history.some(msg => msg.role === "user")) {
      const historyEmbedding = this.embeddingModel(context.history.slice(-1)[0] as UserMessage).content;
      const contextSimilarity = this.calculateSimilarity(historyEmbedding, descriptionEmbedding);
      contextScore = contextSimilarity * 0.3; // Weight context slightly less
    }

    // 3. Combination (Weights can be tuned)
    const finalScore = (score * 0.6) + (contextScore * 0.4);

    return { tool, score: finalScore };
  }

  public selectTools(context: SelectionContext, topN: number = 3): { tools: ToolDefinition[]; scores: number[] } {
    if (!context.availableTools || context.availableTools.length === 0) {
      return { tools: [], scores: [] };
    }

    const scoredTools = context.availableTools.map(tool => this.scoreTool(context, tool));

    // Rank and select top N
    scoredTools.sort((a, b) => b.score - a.score);

    const topNTools = scoredTools.slice(0, topN);

    return {
      tools: topNTools.map(item => item.tool),
      scores: topNTools.map(item => item.score),
    };
  }
}