import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface Intent {
  intent: string;
  parameters: Record<string, any>;
}

interface ContextChunk {
  id: string;
  content: string;
  metadata: Record<string, any>;
  relevanceScore: number;
}

interface IntentClassifier {
  classify: (query: string) => Intent;
}

class ContextualIntentRetriever {
  private intentClassifier: IntentClassifier;
  private vectorStore: {
    search: (query: string, intentFilters?: Record<string, any>) => Promise<{ chunks: ContextChunk[]; score: number }>;
  };

  constructor(intentClassifier: IntentClassifier, vectorStore: {
    search: (query: string, intentFilters?: Record<string, any>) => Promise<{ chunks: ContextChunk[]; score: number }>;
  }) {
    this.intentClassifier = intentClassifier;
    this.vectorStore = vectorStore;
  }

  private extractKeywords(intent: Intent): string {
    const params = intent.parameters;
    const keys = Object.keys(params);
    if (keys.length === 0) return "";
    return keys.map(key => key.toLowerCase()).join(" ") + " " + intent.intent.toLowerCase();
  }

  private calculateIntentBoost(chunk: ContextChunk, intent: Intent): number {
    let boost = 0;
    const params = intent.parameters;

    for (const key in params) {
      const paramValue = params[key];
      const lowerCaseParam = String(paramValue).toLowerCase();

      // Check metadata match
      if (chunk.metadata[key] && String(chunk.metadata[key]).toLowerCase().includes(lowerCaseParam)) {
        boost += 0.2;
      }

      // Check content match
      if (chunk.content.toLowerCase().includes(lowerCaseParam)) {
        boost += 0.3;
      }
    }
    return boost;
  }

  public async retrieveContext(query: string, history: Message[]): Promise<ContextChunk[]> {
    const intent = this.intentClassifier.classify(query);
    const baseQuery = query;
    const intentFilters = { intent: intent.intent };

    const { chunks: initialChunks, score: initialScore } = await this.vectorStore.search(baseQuery, intentFilters);

    const boostedChunks: ContextChunk[] = initialChunks.map(chunk => {
      const boost = this.calculateIntentBoost(chunk, intent);
      return {
        ...chunk,
        relevanceScore: chunk.relevanceScore + boost,
      };
    });

    // Sort by the newly calculated, boosted score
    boostedChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return boostedChunks;
  }
}

export { ContextualIntentRetriever };