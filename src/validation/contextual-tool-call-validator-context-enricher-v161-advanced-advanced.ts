import { AgentContext } from "./agent-context-service.js";
import { ResourceMetrics } from "./resource-metrics-service.js";
import { ContextualStateDiff } from "./contextual-state-diff-service.js";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type ToolCallRequest = {
  tool_name: string;
  tool_input: Record<string, unknown>;
};

export interface EnrichedContext {
  history: Message[];
  resourceUsage: {
    cpu_percent: number;
    memory_bytes: number;
    network_throughput_kbps: number;
  };
  stateDiff: Record<string, any>;
  temporalContext: {
    current_timestamp: number;
    session_duration_seconds: number;
  };
  explicitPayload: Record<string, unknown>;
  toolCallRequest: ToolCallRequest;
}

export class ContextualToolCallValidatorContextEnricher {
  private agentContextService: AgentContext;
  private resourceMetricsService: ResourceMetrics;
  private stateDiffService: ContextualStateDiff;

  constructor(
    agentContextService: AgentContext,
    resourceMetricsService: ResourceMetrics,
    stateDiffService: ContextualStateDiff
  ) {
    this.agentContextService = agentContextService;
    this.resourceMetricsService = resourceMetricsService;
    this.stateDiffService = stateDiffService;
  }

  enrichContext(
    toolCallRequest: ToolCallRequest,
    history: Message[],
    explicitContextPayload: Record<string, unknown>
  ): EnrichedContext {
    const resourceUsage = this.resourceMetricsService.getMetrics();
    const stateDiff = this.stateDiffService.calculateDiff();
    const agentContext = this.agentContextService.getLatestContext();

    const enrichedContext: EnrichedContext = {
      history: history,
      resourceUsage: resourceUsage,
      stateDiff: stateDiff,
      temporalContext: {
        current_timestamp: Date.now(),
        session_duration_seconds: agentContext.getSessionDuration(),
      },
      explicitPayload: explicitContextPayload,
      toolCallRequest: toolCallRequest,
    };

    return enrichedContext;
  }
}