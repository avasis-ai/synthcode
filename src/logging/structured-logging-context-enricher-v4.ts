import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ResourceMetrics {
  cpuUsageMs: number;
  memoryUsageBytes: number;
  networkLatencyMs: number;
}

export interface DependencyGraphSnapshot {
  nodes: string[];
  edges: { source: string; target: string; weight: number }[];
}

export interface ExecutionContext {
  resourceMetrics: ResourceMetrics;
  graphSnapshot: DependencyGraphSnapshot;
  activePolicies: Record<string, boolean>;
}

export interface EnrichedLogRecord {
  timestamp: number;
  level: "info" | "warn" | "error";
  message: string;
  context: Record<string, unknown>;
  enrichment: {
    executionContext: ExecutionContext;
    metadata: Record<string, unknown>;
  };
}

export class StructuredLoggingContextEnricherV4 {
  private context: ExecutionContext;

  constructor(context: ExecutionContext) {
    this.context = context;
  }

  enrich(
    logRecord: {
      timestamp: number;
      level: "info" | "warn" | "error";
      message: string;
      context: Record<string, unknown>;
    }: {
      timestamp: number;
      level: "info" | "warn" | "error";
      message: string;
      context: Record<string, unknown>;
    }
  ): EnrichedLogRecord {
    return {
      timestamp: logRecord.timestamp,
      level: logRecord.level,
      message: logRecord.message,
      context: logRecord.context,
      enrichment: {
        executionContext: this.context,
        metadata: {
          enricherVersion: "v4",
          source: "context-enricher",
        },
      },
    };
  }
}