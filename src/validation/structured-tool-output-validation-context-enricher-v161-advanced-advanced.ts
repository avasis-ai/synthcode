import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ContextSource = {
  sourceName: string;
  precedence: number;
  context: Record<string, unknown>;
};

type ConflictResolutionStrategy = "highest-precedence" | "last-write-wins" | "most-reliable-source";

export class StructuredToolOutputValidationContextEnricher {
  private readonly defaultStrategy: ConflictResolutionStrategy = "highest-precedence";

  enrichContext(
    sources: ContextSource[],
    strategy: ConflictResolutionStrategy = this.defaultStrategy
  ): Record<string, unknown> {
    if (!sources || sources.length === 0) {
      return {};
    }

    const sortedSources = [...sources].sort((a, b) => b.precedence - a.precedence);

    if (strategy === "highest-precedence") {
      return this.mergeByPrecedence(sortedSources);
    } else if (strategy === "last-write-wins") {
      return this.mergeLastWriteWins(sortedSources);
    } else if (strategy === "most-reliable-source") {
      return this.mergeMostReliable(sortedSources);
    }

    return {};
  }

  private mergeByPrecedence(sortedSources: ContextSource[]): Record<string, unknown> {
    const mergedContext: Record<string, unknown> = {};
    for (const source of sortedSources) {
      Object.assign(mergedContext, source.context);
    }
    return mergedContext;
  }

  private mergeLastWriteWins(sortedSources: ContextSource[]): Record<string, unknown> {
    const mergedContext: Record<string, unknown> = {};
    // Since sources are sorted by precedence (highest first), we iterate and overwrite
    // to simulate the "last write" if we consider the highest precedence the "last" effective write.
    // For true LWW, we'd need timestamps, but adhering to the structure, we overwrite.
    for (const source of sortedSources) {
      Object.assign(mergedContext, source.context);
    }
    return mergedContext;
  }

  private mergeMostReliable(sortedSources: ContextSource[]): Record<string, unknown> {
    // In a real scenario, reliability would be determined by metadata.
    // Here, we assume the highest precedence source is the most reliable.
    const mergedContext: Record<string, unknown> = {};
    if (sortedSources.length > 0) {
      Object.assign(mergedContext, sortedSources[0].context);
    }
    return mergedContext;
  }

  /**
   * Enriches the validation context by merging data from multiple sources based on defined precedence rules.
   * @param sources An array of context sources, each with a name, precedence, and context data.
   * @param strategy The conflict resolution strategy to use.
   * @returns A single, enriched context object.
   */
  public enrich(sources: ContextSource[], strategy?: ConflictResolutionStrategy): Record<string, unknown> {
    return this.enrichContext(sources, strategy);
  }
}