import { UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock, Message } from "./types";

export interface ResourceMetrics {
  cpu_cycles: number;
  memory_usage_kb: number;
  network_latency_ms: number;
}

export interface TemporalContext {
  timestamp: number;
  valid_until: number;
}

export interface ContextualStatePayload {
  messages: Message[];
  resource_metrics: ResourceMetrics;
  temporal_context: TemporalContext;
  metadata: Record<string, unknown>;
}

export interface StateDiff {
  message_diff: {
    message: Message;
    diff_type: "added" | "modified" | "removed";
  }[];
  resource_diff: {
    metric: keyof ResourceMetrics;
    old_value: any;
    new_value: any;
    significance: "high" | "medium" | "low";
  }[];
  temporal_diff: {
    field: keyof TemporalContext;
    old_value: any;
    new_value: any;
    is_stale: boolean;
  }[];
  summary: string;
}

export class ContextualStateDiffer {
  private static calculateResourceDiff(oldState: ContextualStatePayload, newState: ContextualStatePayload): StateDiff["resource_diff"] {
    const resourceDiff: StateDiff["resource_diff"] = [];
    const oldMetrics = oldState.resource_metrics;
    const newMetrics = newState.resource_metrics;

    (Object.keys(oldMetrics) as Array<keyof ResourceMetrics>).forEach(metric => {
      const oldVal = oldMetrics[metric];
      const newVal = newMetrics[metric];
      let significance: "high" | "medium" | "low" = "low";

      if (Math.abs(oldVal - newVal) > 0.1 * Math.max(Math.abs(oldVal), Math.abs(newVal))) {
        significance = "high";
      } else if (Math.abs(oldVal - newVal) > 0.01 * Math.max(Math.abs(oldVal), Math.abs(newVal))) {
        significance = "medium";
      }

      resourceDiff.push({
        metric,
        old_value: oldVal,
        new_value: newVal,
        significance,
      });
    });
    return resourceDiff;
  }

  private static calculateTemporalDiff(oldState: ContextualStatePayload, newState: ContextualStatePayload): StateDiff["temporal_diff"] {
    const temporalDiff: StateDiff["temporal_diff"] = [];
    const oldCtx = oldState.temporal_context;
    const newCtx = newState.temporal_context;

    const diffFields: Array<keyof TemporalContext> = ["timestamp", "valid_until"];

    diffFields.forEach(field => {
      const oldVal = oldCtx[field];
      const newVal = newCtx[field];
      let isStale = false;

      if (field === "valid_until" && newVal < Date.now()) {
        isStale = true;
      }

      temporalDiff.push({
        field,
        old_value: oldVal,
        new_value: newVal,
        is_stale: isStale,
      });
    });
    return temporalDiff;
  }

  private static calculateMessageDiff(oldMessages: Message[], newMessages: Message[]): StateDiff["message_diff"] {
    const messageDiff: StateDiff["message_diff"] = [];
    // Simplified diff: assume append/replace for this context
    if (oldMessages.length === 0 && newMessages.length > 0) {
      newMessages.forEach(msg => messageDiff.push({ message: msg, diff_type: "added" }));
    } else if (oldMessages.length > 0 && newMessages.length === 0) {
      oldMessages.forEach(msg => messageDiff.push({ message: msg, diff_type: "removed" }));
    } else {
      // For simplicity, we only check the last message for modification
      if (oldMessages.length > 0 && newMessages.length > 0) {
        const lastOld = oldMessages[oldMessages.length - 1];
        const lastNew = newMessages[newMessages.length - 1];

        // Deep comparison placeholder
        const areEqual = JSON.stringify(lastOld) === JSON.stringify(lastNew);

        if (!areEqual) {
          messageDiff.push({ message: lastNew, diff_type: "modified" });
        }
      }
    }
    return messageDiff;
  }

  public static diff(oldState: ContextualStatePayload, newState: ContextualStatePayload): StateDiff {
    const messageDiff = ContextualStateDiffer.calculateMessageDiff(oldState.messages, newState.messages);
    const resourceDiff = ContextualStateDiffer.calculateResourceDiff(oldState, newState);
    const temporalDiff = ContextualStateDiffer.calculateTemporalDiff(oldState, newState);

    let summary = "State updated.";
    if (messageDiff.some(d => d.diff_type === "modified")) {
      summary = "Message content was modified.";
    } else if (resourceDiff.some(d => d.significance === "high")) {
      summary = "Significant resource usage change detected.";
    } else if (temporalDiff.some(d => d.is_stale)) {
      summary = "Temporal context indicates potential staleness.";
    }

    return {
      message_diff: messageDiff,
      resource_diff: resourceDiff,
      temporal_diff: temporalDiff,
      summary: summary,
    };
  }
}