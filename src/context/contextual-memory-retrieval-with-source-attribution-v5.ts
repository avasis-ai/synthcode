import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type SourceAttribution =
  | "USER_INPUT"
  | "ASSISTANT_OUTPUT"
  | "TOOL_RESULT"
  | "INTERNAL_REASONING"
  | "EXTERNAL_DOCUMENT"
  | "SYSTEM_INFERENCE";

export interface ContextEntry {
  content: string;
  source: SourceAttribution;
  metadata: Record<string, any>;
}

export interface ContextualMemoryRetriever {
  retrieveContext(
    query: string,
    history: Message[],
    k: number
  ): {
    context: ContextEntry[];
    attributionWeights: Record<SourceAttribution, number>;
  };
}

export class ContextualMemoryRetrieverV5 implements ContextualMemoryRetriever {
  private readonly sourceWeighting: Record<SourceAttribution, number>;

  constructor() {
    this.sourceWeighting = {
      "USER_INPUT": 1.0,
      "ASSISTANT_OUTPUT": 1.1,
      "TOOL_RESULT": 1.2,
      "INTERNAL_REASONING": 1.5,
      "EXTERNAL_DOCUMENT": 1.3,
      "SYSTEM_INFERENCE": 1.6,
    };
  }

  private calculateWeight(source: SourceAttribution): number {
    return this.sourceWeighting[source] ?? 1.0;
  }

  public retrieveContext(
    query: string,
    history: Message[],
    k: number
  ): {
    context: ContextEntry[];
    attributionWeights: Record<SourceAttribution, number>;
  } {
    const mockContextStore: ContextEntry[] = this.generateMockContext(history);
    const weightedContext = this.applySourceWeighting(mockContextStore, query);

    const topKContext = weightedContext.slice(0, k);

    const finalWeights: Record<SourceAttribution, number> = {
      "USER_INPUT": 0,
      "ASSISTANT_OUTPUT": 0,
      "TOOL_RESULT": 0,
      "INTERNAL_REASONING": 0,
      "EXTERNAL_DOCUMENT": 0,
      "SYSTEM_INFERENCE": 0,
    };

    topKContext.forEach(entry => {
      const weight = this.calculateWeight(entry.source);
      finalWeights[entry.source] = (finalWeights[entry.source] || 0) + weight;
    });

    return {
      context: topKContext,
      attributionWeights: finalWeights,
    };
  }

  private generateMockContext(history: Message[]): ContextEntry[] {
    const mock: ContextEntry[] = [];
    let index = 0;

    // Simulate context from history messages
    history.forEach((message, i) => {
      if (message.role === "user") {
        mock.push({
          content: `User query segment ${i}: ${message.content}`,
          source: "USER_INPUT",
          metadata: { index: i, type: "user" },
        });
      } else if (message.role === "assistant") {
        mock.push({
          content: `Assistant response segment ${i}: ${message.content}`,
          source: "ASSISTANT_OUTPUT",
          metadata: { index: i, type: "assistant" },
        });
      }
    });

    // Simulate external/system context
    mock.push({
      content: "Document chunk about advanced retrieval techniques.",
      source: "EXTERNAL_DOCUMENT",
      metadata: { source_id: "doc_xyz", chunk_size: 50 },
    });

    // Simulate internal reasoning context
    mock.push({
      content: "Initial thought process suggests focusing on attribution depth.",
      source: "INTERNAL_REASONING",
      metadata: { step: 1 },
    });

    // Simulate system inference context (the new level)
    mock.push({
      content: "System inference suggests prioritizing sources with high novelty.",
      source: "SYSTEM_INFERENCE",
      metadata: { model_version: "v5.1" },
    });

    // Add more mock entries to ensure sorting/weighting works
    for (let i = 0; i < 3; i++) {
        mock.push({
            content: `Generic context chunk ${i}`,
            source: "TOOL_RESULT",
            metadata: { tool_run: i }
        });
    }

    return mock;
  }

  private applySourceWeighting(context: ContextEntry[], query: string): ContextEntry[] {
    // Simple scoring mechanism: score = relevance_to_query * source_weight
    const scoredContext: { entry: ContextEntry; score: number }[] = context.map(entry => {
      // Mock relevance scoring based on content length and query match
      const relevance = Math.min(1.0, entry.content.length / 100 + (entry.content.includes(query.substring(0, 5)) ? 0.3 : 0));
      const weight = this.calculateWeight(entry.source);
      const score = relevance * weight;
      return { entry, score };
    });

    // Sort by score descending
    scoredContext.sort((a, b) => b.score - a.score);

    // Return only the entries, maintaining the sorted order
    return scoredContext.map(item => item.entry);
  }
}