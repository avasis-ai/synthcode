import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface DependencyGraph {
  [key: string]: {
    dependencies: string[];
    metadata: Record<string, unknown>;
  };
}

export interface ExecutionHistory {
  messages: Message[];
  toolOutputs: Record<string, any>;
}

export interface EnrichedValidationContext {
  originalContext: Record<string, unknown>;
  history: ExecutionHistory;
  dependencyGraph: DependencyGraph;
  enrichedMetadata: Record<string, unknown>;
}

export class StructuredToolOutputValidationContextEnricher {
  private history: ExecutionHistory;
  private graph: DependencyGraph;

  constructor(history: ExecutionHistory, graph: DependencyGraph) {
    this.history = history;
    this.graph = graph;
  }

  private aggregateMetadata(nodeId: string): Record<string, unknown> {
    const node = this.graph[nodeId];
    if (!node) {
      return {};
    }

    let metadata: Record<string, unknown> = {
      ...node.metadata,
    };

    if (node.dependencies && node.dependencies.length > 0) {
      for (const depId of node.dependencies) {
        const depNode = this.graph[depId];
        if (depNode) {
          const depMetadata = this.aggregateMetadata(depId);
          metadata = {
            ...metadata,
            [`dependency_${depId}_metadata`]: depMetadata,
          } as Record<string, unknown>;
        }
      }
    }
    return metadata;
  }

  public enrich(originalContext: Record<string, unknown>): EnrichedValidationContext {
    const enrichedMetadata: Record<string, unknown> = {};

    // Aggregate metadata from all nodes in the graph (assuming we want a holistic view)
    for (const nodeId in this.graph) {
      const metadata = this.aggregateMetadata(nodeId);
      enrichedMetadata[`node_${nodeId}_metadata`] = metadata;
    }

    return {
      originalContext: originalContext,
      history: this.history,
      dependencyGraph: this.graph,
      enrichedMetadata: enrichedMetadata,
    };
  }
}