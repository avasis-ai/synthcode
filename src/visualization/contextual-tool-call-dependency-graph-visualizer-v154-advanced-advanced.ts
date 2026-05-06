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

export interface ResourceConstraint {
  resourceName: string;
  minUsage: number;
  maxUsage: number;
}

export interface TimeWindow {
  startTimeMs: number;
  endTimeMs: number;
}

export interface ContextualToolCall {
  toolUseId: string;
  toolName: string;
  input: Record<string, unknown>;
  dependencies: string[];
  resourceConstraints?: ResourceConstraint[];
  temporalWindow?: TimeWindow;
}

export interface EnrichedToolCallContext {
  toolCall: ContextualToolCall;
  messageHistory: Message[];
}

export interface DependencyGraphData {
  nodes: {
    id: string;
    label: string;
    type: "tool_call" | "user" | "assistant" | "result";
    context?: ContextualToolCall;
    metadata: Record<string, any>;
  }[];
  edges: {
    sourceId: string;
    targetId: string;
    relationship: "depends_on" | "follows" | "uses_context";
    weight?: number;
  }[];
}

export class ContextualToolCallDependencyGraphVisualizer {
  private readonly history: Message[];

  constructor(history: Message[]) {
    this.history = history;
  }

  private extractToolCalls(message: Message): ContextualToolCall[] {
    const toolCalls: ContextualToolCall[] = [];
    if (message.role === "assistant" && Array.isArray((message as AssistantMessage).content)) {
      for (const block of (message as AssistantMessage).content) {
        if (block.type === "tool_use") {
          const toolUseBlock = block as ToolUseBlock;
          // Mocking advanced context extraction for demonstration
          const mockContext: ContextualToolCall = {
            toolUseId: toolUseBlock.id,
            toolName: toolUseBlock.name,
            input: toolUseBlock.input,
            dependencies: [],
            resourceConstraints: [
              { resourceName: "cpu", minUsage: 1, maxUsage: 5 },
            ],
            temporalWindow: { startTimeMs: Date.now(), endTimeMs: Date.now() + 5000 },
          };
          toolCalls.push(mockContext);
        }
      }
    }
    return toolCalls;
  }

  private buildNodes(toolCalls: ContextualToolCall[]): {
    id: string;
    label: string;
    type: "tool_call" | "user" | "assistant" | "result";
    context?: ContextualToolCall;
    metadata: Record<string, any>;
  }[] {
    const nodes: {
      id: string;
      label: string;
      type: "tool_call" | "user" | "assistant" | "result";
      context?: ContextualToolCall;
      metadata: Record<string, any>;
    }[] = [];

    // 1. User Nodes
    if (this.history.length > 0 && this.history[0].role === "user") {
      const userMsg = this.history[0] as UserMessage;
      nodes.push({
        id: "user_start",
        label: `User Input: ${userMsg.content.substring(0, 30)}...`,
        type: "user",
        metadata: { content: userMsg.content },
      });
    }

    // 2. Assistant/Tool Call Nodes
    let callIndex = 0;
    for (const msg of this.history) {
      if (msg.role === "assistant") {
        const assistantMsg = msg as AssistantMessage;
        for (const block of (assistantMsg as AssistantMessage).content) {
          if (block.type === "tool_use") {
            const toolUseBlock = block as ToolUseBlock;
            const toolCalls = this.extractToolCalls([msg]);
            for (const context of toolCalls) {
              const nodeId = `tool_${toolUseBlock.id}`;
              nodes.push({
                id: nodeId,
                label: `${toolUseBlock.name} (Call ${callIndex++})`,
                type: "tool_call",
                context: context,
                metadata: { toolUseId: toolUseBlock.id },
              });
            }
          }
        }
      }
    }

    // 3. Result Nodes (Simplified)
    for (const msg of this.history) {
      if (msg.role === "tool") {
        const toolResultMsg = msg as ToolResultMessage;
        nodes.push({
          id: `tool_result_${toolResultMsg.tool_use_id}`,
          label: `Tool Result (${toolResultMsg.tool_use_id.substring(0, 4)}...)`,
          type: "result",
          metadata: { content: toolResultMsg.content, isError: toolResultMsg.is_error };
        });
      }
    }

    return nodes;
  }

  private buildEdges(toolCalls: ContextualToolCall[]): {
    sourceId: string;
    targetId: string;
    relationship: "depends_on" | "follows" | "uses_context";
    weight?: number;
  }[] {
    const edges: {
      sourceId: string;
      targetId: string;
      relationship: "depends_on" | "follows" | "uses_context";
      weight?: number;
    }[] = [];

    // Mocking dependency edges based on context
    for (const context of toolCalls) {
      // Dependency: Tool Call -> (Dependency Node)
      context.dependencies.forEach(depId => {
        edges.push({
          sourceId: `tool_${context.toolUseId}`,
          targetId: `dependency_${depId}`,
          relationship: "depends_on",
          weight: 1.0,
        });
      });

      // Contextual Flow: Tool Call -> (Next Step/Result)
      // In a real scenario, we'd map this to the next message in history.
      edges.push({
        sourceId: `tool_${context.toolUseId}`,
        targetId: "next_step", // Placeholder for the next logical step
        relationship: "uses_context",
        weight: 1.5,
      });
    }

    return edges;
  }

  public visualize(enrichmentContext: {
    toolCalls: ContextualToolCall[];
    history: Message[];
  }): DependencyGraphData {
    const { toolCalls, history: fullHistory } = enrichmentContext;

    // 1. Build Nodes
    const nodes = this.buildNodes(toolCalls);

    // 2. Build Edges
    const edges = this.buildEdges(toolCalls);

    return {
      nodes,
      edges,
    };
  }
}