import { Message, ContentBlock, ToolUseBlock, ThinkingBlock, TextBlock } from "./types";

export interface ExecutionHistory {
  messages: Message[];
  tool_calls: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  }[];
}

export interface DependencyGraph {
  dependencies: Record<string, string[]>;
}

export interface EnrichedValidationContext {
  originalContext: Record<string, unknown>;
  historyMetadata: {
    lastToolCallId: string | null;
    relevantToolUses: ToolUseBlock[];
    executionSequence: string[];
  };
  dependencyMetadata: {
    requiredDependencies: string[];
    potentialConflicts: string[];
  };
}

export class StructuredToolOutputValidationContextEnricher {
  private history: ExecutionHistory;
  private graph: DependencyGraph;

  constructor(history: ExecutionHistory, graph: DependencyGraph) {
    this.history = history;
    this.graph = graph;
  }

  private deriveHistoryMetadata(): {
    lastToolCallId: string | null;
    relevantToolUses: ToolUseBlock[];
    executionSequence: string[];
  } {
    const lastToolCall = this.history.tool_calls.length > 0 ? this.history.tool_calls[this.history.tool_calls.length - 1] : null;
    const relevantToolUses: ToolUseBlock[] = [];
    const executionSequence: string[] = [];

    this.history.messages.forEach(message => {
      if (message.role === "assistant" && message.content) {
        (message.content as ContentBlock[]).forEach(block => {
          if (block.type === "tool_use") {
            relevantToolUses.push(block as ToolUseBlock);
          }
        });
      }
    });

    this.history.messages.forEach(message => {
      if (message.role === "user") {
        executionSequence.push(`user:${message.content.toString()}`);
      } else if (message.role === "assistant") {
        executionSequence.push(`assistant:${message.content.toString()}`);
      }
    });

    return {
      lastToolCallId: lastToolCall ? lastToolCall.id : null,
      relevantToolUses: relevantToolUses,
      executionSequence: executionSequence,
    };
  }

  private deriveDependencyMetadata(): {
    requiredDependencies: string[];
    potentialConflicts: string[];
  } {
    const requiredDependencies: string[] = Object.keys(this.graph.dependencies);
    const potentialConflicts: string[] = [];

    for (const [key, deps] of Object.entries(this.graph.dependencies)) {
      if (deps.length > 1) {
        potentialConflicts.push(`${key} depends on multiple: ${deps.join(', ')}`);
      }
    }

    return {
      requiredDependencies: requiredDependencies,
      potentialConflicts: potentialConflicts,
    };
  }

  enrich(originalContext: Record<string, unknown>): EnrichedValidationContext {
    const historyMetadata = this.deriveHistoryMetadata();
    const dependencyMetadata = this.deriveDependencyMetadata();

    return {
      originalContext: originalContext,
      historyMetadata: historyMetadata,
      dependencyMetadata: dependencyMetadata,
    };
  }
}