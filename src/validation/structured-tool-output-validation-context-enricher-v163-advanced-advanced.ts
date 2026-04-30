import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface IContextSource {
  fetchContext: (baseContext: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

interface ITemporalContextSource extends IContextSource {
  getSourceName: () => string;
}

interface IResourceContextSource extends IContextSource {
  getSourceName: () => string;
}

interface IKnowledgeGraphContextSource extends IContextSource {
  getSourceName: () => string;
}

type ContextSource = ITemporalContextSource | IResourceContextSource | IKnowledgeGraphContextSource;

type ConflictResolutionStrategy = "most-recent" | "highest-priority" | "first-write";

export class StructuredToolOutputValidationContextEnricher {
  private sources: ContextSource[];
  private conflictStrategy: ConflictResolutionStrategy;

  constructor(sources: ContextSource[], conflictStrategy: ConflictResolutionStrategy = "most-recent") {
    this.sources = sources;
    this.conflictStrategy = conflictStrategy;
  }

  private resolveConflict(
    key: string,
    existingValue: unknown,
    newValue: unknown
  ): unknown {
    switch (this.conflictStrategy) {
      case "most-recent":
        // Simple assumption: the last source processed wins for simplicity in this context
        return newValue;
      case "highest-priority":
        // In a real system, sources would need explicit priority metadata.
        // Here, we arbitrarily favor the new value if they conflict.
        return newValue;
      case "first-write":
        return existingValue;
      default:
        return newValue;
    }
  }

  public async enrichContext(
    baseContext: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    let mergedContext: Record<string, unknown> = { ...baseContext };

    for (const source of this.sources) {
      try {
        const sourceContext = await source.fetchContext(mergedContext);
        
        const newMergedContext: Record<string, unknown> = { ...mergedContext };

        for (const key in sourceContext) {
          if (Object.prototype.hasOwnProperty.call(sourceContext, key)) {
            const value = sourceContext[key];
            const existingValue = newMergedContext[key];

            if (existingValue === undefined) {
              newMergedContext[key] = value;
            } else {
              newMergedContext[key] = this.resolveConflict(
                key,
                existingValue,
                value
              );
            }
          }
        }
        mergedContext = newMergedContext;
      } catch (error) {
        console.error(`Error enriching context from source ${source.getSourceName()}:`, error);
        // Continue processing other sources even if one fails
      }
    }

    return mergedContext;
  }
}