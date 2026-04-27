import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ResourceUsageMetrics {
  tokenUsageDelta: number;
  costEstimateCents: number;
}

export interface EnrichedContext {
  sessionId: string;
  activeToolCallId?: string;
  currentStep?: string;
  resourceUsage: ResourceUsageMetrics;
  metadata: Record<string, unknown>;
}

export class StructuredLoggingContextEnricher {
  private readonly sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  private extractToolCallId(messages: Message[]): string | undefined {
    const lastToolMessage = messages.slice(-1).find(
      (msg) => msg.role === "tool" && (msg as ToolResultMessage).tool_use_id,
    );
    return lastToolMessage ? (lastToolMessage as ToolResultMessage).tool_use_id : undefined;
  }

  private extractCurrentStep(messages: Message[]): string | undefined {
    // Simplified logic: Assume the last user message context defines the step
    const lastUserMessage = messages.slice().reverse().find(
      (msg) => msg.role === "user",
    );
    if (lastUserMessage) {
      return `Processing user input for: ${lastUserMessage.content.substring(0, 30)}...`;
    }
    return undefined;
  }

  private enrichWithMetrics(
    context: EnrichedContext,
    toolContext: Record<string, unknown>,
    executionContext: Record<string, unknown>,
  ): EnrichedContext {
    const resourceUsage: ResourceUsageMetrics = {
      tokenUsageDelta: (toolContext as any)?.tokenDelta || 0,
      costEstimateCents: (toolContext as any)?.cost || 0,
    };

    return {
      ...context,
      resourceUsage: {
        ...resourceUsage,
        tokenUsageDelta: resourceUsage.tokenUsageDelta,
        costEstimateCents: resourceUsage.costEstimateCents,
      },
    };
  }

  public enrich(
    context: EnrichedContext,
    messages: Message[],
    toolContext: Record<string, unknown> = {},
    executionContext: Record<string, unknown> = {}
  ): EnrichedContext {
    const activeToolCallId = this.extractToolCallId(messages);
    const currentStep = this.extractCurrentStep(messages);

    const enrichedContext = {
      ...context,
      activeToolCallId: activeToolCallId,
      currentStep: currentStep,
      metadata: {
        ...context.metadata,
        lastMessageRoles: messages.map((msg) => msg.role),
      },
    };

    return this.enrichWithMetrics(
      enrichedContext,
      toolContext,
      executionContext,
    );
  }
}