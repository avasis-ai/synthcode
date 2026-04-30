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

export interface TemporalContext {
  startTime: number;
  endTime: number;
  durationMs: number;
}

export interface DependencyLink {
  sourceId: string;
  targetId: string;
  dependencyType: "precedes" | "succeeds" | "requires";
  reason: string;
}

export interface EnrichedContext {
  originalContext: Message[];
  temporalContext: TemporalContext;
  dependencyLinks: DependencyLink[];
  toolCallDependencies: Record<string, {
    upstream: DependencyLink[];
    downstream: DependencyLink[];
  }>;
}

export class StructuredToolCallValidatorContextEnricher {
  enrich(
    context: Message[],
    currentToolCallId: string,
    executionHistory: {
      messages: Message[];
      temporalData: TemporalContext;
      dependencies: DependencyLink[];
    }
  ): EnrichedContext {
    const enrichedContext: EnrichedContext = {
      originalContext: context,
      temporalContext: executionHistory.temporalData,
      dependencyLinks: executionHistory.dependencies,
      toolCallDependencies: {},
    };

    const enrichedToolCallDependencies: Record<string, {
      upstream: DependencyLink[];
      downstream: DependencyLink[];
    }> = {};

    // Simulate complex dependency mapping based on history
    for (const link of executionHistory.dependencies) {
      if (link.targetId === currentToolCallId) {
        if (!enrichedToolCallDependencies[currentToolCallId]) {
          enrichedToolCallDependencies[currentToolCallId] = {
            upstream: [],
            downstream: [],
          };
        }
        enrichedToolCallDependencies[currentToolCallId].upstream.push(link);
      }
      if (link.sourceId === currentToolCallId) {
        if (!enrichedToolCallDependencies[currentToolCallId]) {
          enrichedToolCallDependencies[currentToolCallId] = {
            upstream: [],
            downstream: [],
          };
        }
        enrichedToolCallDependencies[currentToolCallId].downstream.push(link);
      }
    }

    // Ensure every tool call ID in the context gets an entry, even if empty
    const allToolCallIds = new Set<string>();
    context.forEach(msg => {
      if (msg.role === "assistant" && msg.content.some(block => block.type === "tool_use")) {
        const toolUseBlock = (msg.content.find(block => block.type === "tool_use") as ToolUseBlock);
        if (toolUseBlock) {
          allToolCallIds.add(toolUseBlock.id);
        }
      }
    });

    allToolCallIds.forEach(id => {
      if (!enrichedToolCallDependencies[id]) {
        enrichedToolCallDependencies[id] = { upstream: [], downstream: [] };
      }
    });

    enrichedContext.toolCallDependencies = enrichedToolCallDependencies;

    return enrichedContext;
  }
}