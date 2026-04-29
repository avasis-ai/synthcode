import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface ResourceConstraint {
  resourceName: string;
  limit: number;
  unit: "count" | "bytes" | "duration";
}

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  constraint?: ResourceConstraint;
}

export interface GraphMetadata {
  dependencies: DependencyEdge[];
  resourceConstraints: ResourceConstraint[];
}

export interface EnrichedValidationContext {
  originalContext: {
    messages: Message[];
    // Add other context fields if necessary
  };
  graphMetadata: GraphMetadata;
}

export class StructuredToolOutputValidationContextEnricher {
  private readonly graphMetadata: GraphMetadata;

  constructor(graphMetadata: GraphMetadata) {
    this.graphMetadata = graphMetadata;
  }

  enrich(context: { messages: Message[] }): EnrichedValidationContext {
    return {
      originalContext: context,
      graphMetadata: this.graphMetadata,
    };
  }
}