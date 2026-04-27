import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ResourceMetrics {
  cpuUsageMs: number;
  memoryUsageBytes: number;
  networkLatencyMs: number;
}

export interface GraphSnapshot {
  nodes: string[];
  edges: { source: string; target: string; weight: number }[];
}

export interface GuardrailStatus {
  guardrailName: string;
  isActive: boolean;
  lastChecked: number;
}

export interface AdvancedContext {
  resourceMetrics: ResourceMetrics;
  graphSnapshot: GraphSnapshot;
  guardrailStatuses: GuardrailStatus[];
}

export interface LogContext {
  sessionId: string;
  userId: string;
  timestamp: number;
  message: Message;
  advancedContext: AdvancedContext;
}

export class StructuredLoggingContextEnricherV3 {
  private readonly defaultContext: Partial<AdvancedContext>;

  constructor(defaultContext?: Partial<AdvancedContext>) {
    this.defaultContext = defaultContext || {};
  }

  enrich(context: {
    sessionId: string;
    userId: string;
    timestamp: number;
    message: Message;
    advancedContext?: AdvancedContext;
  }): LogContext {
    const advancedContext = context.advancedContext || {
      resourceMetrics: { cpuUsageMs: 0, memoryUsageBytes: 0, networkLatencyMs: 0 },
      graphSnapshot: { nodes: [], edges: [] },
      guardrailStatuses: [],
    };

    const finalContext: LogContext = {
      sessionId: context.sessionId,
      userId: context.userId,
      timestamp: context.timestamp,
      message: context.message,
      advancedContext: {
        resourceMetrics: {
          ...this.defaultContext.resourceMetrics,
          ...(advancedContext.resourceMetrics || {}),
        },
        graphSnapshot: {
          ...this.defaultContext.graphSnapshot,
          ...(advancedContext.graphSnapshot || {}),
        },
        guardrailStatuses: [
          ...(this.defaultContext.guardrailStatuses || []),
          ...(advancedContext.guardrailStatuses || []),
        ],
      },
    };

    return finalContext;
  }
}