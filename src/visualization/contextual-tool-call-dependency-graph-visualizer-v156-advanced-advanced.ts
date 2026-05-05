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
  requiredAmount: number;
  unit: "CPU" | "Memory" | "Network";
}

export interface TemporalMetadata {
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
}

export interface AdvancedToolCallContext {
  toolUseId: string;
  resourceConstraints: ResourceConstraint[];
  temporalMetadata: TemporalMetadata;
}

export interface ToolCallDependencyGraphData {
  messages: Message[];
  toolCallContexts: Record<string, AdvancedToolCallContext>;
}

export class ContextualToolCallDependencyGraphVisualizer {
  private data: ToolCallDependencyGraphData;

  constructor(data: ToolCallDependencyGraphData) {
    this.data = data;
  }

  private extractToolCalls(messages: Message[]): {
    toolUseId: string;
    toolUseBlock: ToolUseBlock;
    context: AdvancedToolCallContext;
  }[] {
    const toolCalls: {
      toolUseId: string;
      toolUseBlock: ToolUseBlock;
      context: AdvancedToolCallContext;
    }[] = [];

    for (const message of messages) {
      if (message.role === "assistant") {
        const assistantMessage = message as AssistantMessage;
        for (const block of assistantMessage.content) {
          if (block.type === "tool_use") {
            const toolUseBlock = block as ToolUseBlock;
            const toolUseId = toolUseBlock.id;
            const context = this.data.toolCallContexts[toolUseId] || {
              toolUseId: toolUseId,
              resourceConstraints: [],
              temporalMetadata: {
                startTimeMs: 0,
                endTimeMs: 0,
                durationMs: 0,
              },
            };
            toolCalls.push({
              toolUseId: toolUseId,
              toolUseBlock: toolUseBlock,
              context: context,
            });
          }
        }
      }
    }
    return toolCalls;
  }

  public visualize(): {
    nodes: any[];
    edges: any[];
  } {
    const toolCalls = this.extractToolCalls(this.data.messages);

    const nodes: any[] = [];
    const edges: any[] = [];

    // 1. Process Tool Call Nodes and Contextual Edges
    for (const call of toolCalls) {
      const nodeId = `tool_${call.toolUseId}`;

      // Node representation for the tool call itself
      nodes.push({
        id: nodeId,
        type: "tool_call",
        label: `${call.toolUseBlock.name} (${call.toolUseId})`,
        details: {
          input: call.toolUseBlock.input,
          constraints: call.context.resourceConstraints,
          time: call.context.temporalMetadata,
        },
        style: {
          shape: "diamond",
          color: "#FFC107",
        },
      });

      // Specialized edges representing constraints/time flow
      call.context.resourceConstraints.forEach((constraint, index) => {
        edges.push({
          source: nodeId,
          target: `resource_${call.toolUseId}_${index}`,
          type: "resource_dependency",
          label: `${constraint.resourceName} (${constraint.requiredAmount}${constraint.unit})`,
          style: {
            stroke: "red",
            dashed: true,
          },
        });
      });

      edges.push({
        source: nodeId,
        target: "TIME_FLOW",
        type: "temporal_dependency",
        label: `Duration: ${call.context.temporalMetadata.durationMs}ms`,
        style: {
          stroke: "blue",
          strokeWidth: 2,
        },
      });
    }

    // 2. Process Message Flow Edges (Basic sequence)
    for (let i = 0; i < this.data.messages.length - 1; i++) {
      const sourceMessage = this.data.messages[i];
      const targetMessage = this.data.messages[i + 1];

      edges.push({
        source: `msg_${i}`,
        target: `msg_${i + 1}`,
        type: "sequence",
        label: "->",
        style: {
          stroke: "#9E9E9E",
        },
      });
    }

    // 3. Create Message Nodes (Simplified for this advanced view)
    this.data.messages.forEach((message, index) => {
      nodes.push({
        id: `msg_${index}`,
        type: "message",
        label: `${message.role}: ${message.content.length > 0 ? "Content Present" : ""}`,
        details: {
          role: message.role,
        },
        style: {
          shape: "rectangle",
          color: message.role === "user" ? "#E3F2FD" : "#E8F5E9",
        },
      });
    });

    return { nodes, edges };
  }
}