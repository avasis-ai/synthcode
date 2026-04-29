import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ExecutionMetrics {
  totalTokens: number;
  cumulativeResourceUsage: Record<string, number>;
  toolCallSummary: {
  successCount: number;
  failureCount: number;
}
}

export interface ValidationContext {
  history: Message[];
  metrics: ExecutionMetrics;
  enrichedContext: Record<string, any>;
}

export class StructuredToolOutputValidationContextEnricher {
  enrich(
    context: {
      history: Message[];
      metrics: ExecutionMetrics;
    }
  ): ValidationContext {
    const { history, metrics } = context;

    const toolCallSummary: {
      successCount: number;
      failureCount: number;
    } = {
      successCount: 0,
      failureCount: 0,
    };

    let successfulToolCalls = 0;
    let failedToolCalls = 0;

    history.forEach((message) => {
      if (message.role === "tool" && (message as ToolResultMessage).is_error) {
        failedToolCalls++;
      } else if (message.role === "tool") {
        successfulToolCalls++;
      }
    });

    const enrichedContext: Record<string, any> = {
      executionSummary: {
        totalTokens: metrics.totalTokens,
        cumulativeResourceUsage: metrics.cumulativeResourceUsage,
        toolCallSummary: {
          successCount: successfulToolCalls,
          failureCount: failedToolCalls,
        },
      },
      historySnapshot: history.slice(-10), // Keep only the last 10 messages for context brevity
    };

    return {
      history: history,
      metrics: metrics,
      enrichedContext: enrichedContext,
    };
  }
}