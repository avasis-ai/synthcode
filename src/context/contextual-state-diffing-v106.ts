import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

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

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface AgentContext {
  messages: Message[];
  lastInteractionTime: number;
  resourceMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    networkLatencyMs: number;
  };
}

export interface StateDiffPayload {
  diffedMessages: {
    message: Message;
    changes: {
      contentChanged: boolean;
      temporalConstraintViolated: boolean;
      resourceUsageChanged: {
        cpu: number;
        memory: number;
        network: number;
      };
    };
  }[];
  overallContextChange: {
    contextDiff: boolean;
    resourceDelta: {
      cpu: number;
      memory: number;
      network: number;
    };
  };
}

export class ContextualStateDiffer {
  private readonly temporalWeight: number;
  private readonly resourceWeight: number;

  constructor(temporalWeight: number = 0.4, resourceWeight: number = 0.6) {
    this.temporalWeight = temporalWeight;
    this.resourceWeight = resourceWeight;
  }

  private compareResourceUsage(
    oldMetrics: {
      cpuUsage: number;
      memoryUsage: number;
      networkLatencyMs: number;
    };
    newMetrics: {
      cpuUsage: number;
      memoryUsage: number;
      networkLatencyMs: number;
    }
  ): {
    cpu: number;
    memory: number;
    network: number;
  } {
    return {
      cpu: Math.abs(newMetrics.cpuUsage - oldMetrics.cpuUsage),
      memory: Math.abs(newMetrics.memoryUsage - oldMetrics.memoryUsage),
      network: Math.abs(newMetrics.networkLatencyMs - oldMetrics.networkLatencyMs),
    };
  }

  private calculateMessageDiff(
    oldMessage: Message;
    newMessage: Message;
    context: AgentContext
  ): {
    message: Message;
    changes: {
      contentChanged: boolean;
      temporalConstraintViolated: boolean;
      resourceUsageChanged: {
        cpu: number;
        memory: number;
        network: number;
      };
    };
  } {
    const contentDiff = JSON.stringify(oldMessage) !== JSON.stringify(newMessage);
    const temporalViolated = Math.abs(context.lastInteractionTime - Date.now()) > 60000; // 1 minute threshold
    const resourceDelta = this.compareResourceUsage(
      context.resourceMetrics,
      {
        cpuUsage: 0,
        memoryUsage: 0,
        networkLatencyMs: 0,
      }
    );

    return {
      message: newMessage,
      changes: {
        contentChanged: contentDiff,
        temporalConstraintViolated: temporalViolated,
        resourceUsageChanged: resourceDelta,
      },
    };
  }

  public diff(
    oldContext: AgentContext;
    newContext: AgentContext
  ): StateDiffPayload {
    const diffedMessages: {
      message: Message;
      changes: {
        contentChanged: boolean;
        temporalConstraintViolated: boolean;
        resourceUsageChanged: {
          cpu: number;
          memory: number;
          network: number;
        };
      };
    }[] = [];

    // Simplified message diffing: only compare the last message for demonstration
    if (oldContext.messages.length > 0 && newContext.messages.length > 0) {
      const lastOld = oldContext.messages[oldContext.messages.length - 1];
      const lastNew = newContext.messages[newContext.messages.length - 1];
      diffedMessages.push(
        this.calculateMessageDiff(lastOld, lastNew, newContext)
      );
    }

    const overallContextChange = {
      contextDiff: false,
      resourceDelta: this.compareResourceUsage(
        oldContext.resourceMetrics,
        newContext.resourceMetrics
      ),
    };

    return {
      diffedMessages,
      overallContextChange,
    };
  }
}

export function contextualStateDiffingV106(
  oldContext: AgentContext;
  newContext: AgentContext
): StateDiffPayload {
  const differ = new ContextualStateDiffer();
  return differ.diff(oldContext, newContext);
}