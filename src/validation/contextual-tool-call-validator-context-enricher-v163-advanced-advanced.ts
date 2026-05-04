import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface AgentState {
  currentState: Record<string, unknown>;
  lastToolCallId: string | null;
}

interface ResourceMetrics {
  cpuUsagePercent: number;
  memoryUsageMB: number;
  networkLatencyMs: number;
}

interface ToolCallHistory {
  toolName: string;
  lastUsed: number;
  callCount: number;
}

export interface EnrichedContext {
  agentState: AgentState;
  toolCallHistory: Record<string, ToolCallHistory>;
  resourceMetrics: ResourceMetrics;
  messageHistory: Message[];
}

export class ContextualToolCallValidatorContextEnricher {
  private readonly agentStateManager: { getState: () => AgentState };
  private readonly resourceUsageTracker: { getMetrics: () => ResourceMetrics };
  private readonly historyProvider: { getHistory: () => Record<string, ToolCallHistory> };

  constructor(
    agentStateManager: { getState: () => AgentState },
    resourceUsageTracker: { getMetrics: () => ResourceMetrics },
    historyProvider: { getHistory: () => Record<string, ToolCallHistory> }
  ) {
    this.agentStateManager = agentStateManager;
    this.resourceUsageTracker = resourceUsageTracker;
    this.historyProvider = historyProvider;
  }

  enrich(
    messageHistory: Message[],
  ): EnrichedContext {
    const agentState = this.agentStateManager.getState();
    const resourceMetrics = this.resourceUsageTracker.getMetrics();
    const toolCallHistory = this.historyProvider.getHistory();

    return {
      agentState: agentState,
      toolCallHistory: toolCallHistory,
      resourceMetrics: resourceMetrics,
      messageHistory: messageHistory,
    };
  }
}