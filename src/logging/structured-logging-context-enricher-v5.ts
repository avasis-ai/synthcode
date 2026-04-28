import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ResourceUsage {
  cpu_percent: number;
  memory_bytes: number;
  network_io_bytes: number;
}

export interface TemporalConstraint {
  start_time_utc: Date;
  end_time_utc: Date;
  duration_ms: number;
}

export interface DependencyGraphMetadata {
  dependencies: Record<string, string>;
  graph_version: string;
}

export interface AdvancedContext {
  resource_usage?: ResourceUsage;
  temporal_constraint?: TemporalConstraint;
  dependency_metadata?: DependencyGraphMetadata;
}

export interface StructuredLogContext {
  message_id: string;
  user_id: string;
  session_id: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface EnrichedLogContext extends StructuredLogContext {
  advanced_context: AdvancedContext;
}

export class StructuredLoggingContextEnricherV5 {
  private readonly defaultContext: StructuredLogContext;

  constructor(initialContext: StructuredLogContext) {
    this.defaultContext = {
      message_id: initialContext.message_id,
      user_id: initialContext.user_id,
      session_id: initialContext.session_id,
      timestamp: initialContext.timestamp,
      metadata: {
        ...initialContext.metadata,
        enricher_version: "v5",
      },
    };
  }

  private mergeContext(
    existingContext: StructuredLogContext,
    advancedContext: Partial<AdvancedContext>
  ): EnrichedLogContext {
    return {
      ...existingContext,
      advanced_context: advancedContext,
    };
  }

  public enrich(
    context: StructuredLogContext,
    advancedContext: Partial<AdvancedContext>
  ): EnrichedLogContext {
    return this.mergeContext(context, advancedContext);
  }

  public createInitialContext(
    messageId: string,
    userId: string,
    sessionId: string,
    timestamp: Date,
    initialMetadata: Record<string, unknown> = {}
  ): StructuredLogContext {
    return {
      message_id: messageId,
      user_id: userId,
      session_id: sessionId,
      timestamp: timestamp,
      metadata: {
        ...initialMetadata,
        source: "structured-logging-context-enricher-v5",
      },
    };
  }
}