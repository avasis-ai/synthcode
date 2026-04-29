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

export interface DataLineage {
  sourceId: string;
  sourceType: "tool_output" | "user_input" | "assistant_output";
  targetId: string;
  targetType: "tool_input" | "assistant_input";
  dataKey: string;
}

export interface DependencyGraphPayload {
  messages: Message[];
  lineage: DataLineage[];
}

export class ToolDependencyGraphVisualizerV130 {
  private graphData: DependencyGraphPayload;

  constructor(payload: DependencyGraphPayload) {
    this.graphData = payload;
  }

  private extractToolCalls(messages: Message[]): Map<string, ToolUseBlock> {
    const toolUses = new Map<string, ToolUseBlock>();
    for (const message of messages) {
      if (message.role === "assistant") {
        const assistantMessage = message as AssistantMessage;
        for (const block of assistantMessage.content) {
          if (block.type === "tool_use") {
            const toolUseBlock = block as ToolUseBlock;
            toolUses.set(toolUseBlock.id, toolUseBlock);
          }
        }
      }
    }
    return toolUses;
  }

  private buildGraphStructure(payload: DependencyGraphPayload): {
    nodes: Record<string, { type: string; label: string; details: any }>;
    edges: { source: string; target: string; label: string; lineage: DataLineage | null }[];
  } {
    const nodes: Record<string, { type: string; label: string; details: any }> = {};
    const edges: { source: string; target: string; label: string; lineage: DataLineage | null }[] = [];

    // 1. Process Messages for Nodes
    const toolUses = this.extractToolCalls(payload.messages);
    const messageNodes: Record<string, { type: string; label: string; details: any }> = {};

    payload.messages.forEach((message, index) => {
      const nodeId = `msg_${index}`;
      let label = "";
      let details: any = {};

      if (message.role === "user") {
        label = "User Input";
        details = { content: message.content };
      } else if (message.role === "assistant") {
        label = "Assistant Turn";
        details = { content: message.content };
      } else if (message.role === "tool") {
        label = "Tool Result";
        details = { content: message.content };
      }
      messageNodes[nodeId] = { type: message.role, label: label, details: details };
    });

    // 2. Process Tool Uses (as potential nodes)
    toolUses.forEach((toolUse, id) => {
      const nodeId = `tool_${id}`;
      nodes[nodeId] = {
        type: "tool_use",
        label: toolUse.name,
        details: { input: toolUse.input, id: id },
      };
    });

    // Merge nodes
    Object.assign(nodes, messageNodes);

    // 3. Process Edges (Dependencies and Lineage)
    payload.lineage.forEach((lineage) => {
      let sourceNodeId: string;
      let targetNodeId: string;
      let edgeLabel: string;

      if (lineage.sourceType === "user_input") {
        sourceNodeId = "user_input"; // Simplified source reference
        edgeLabel = `Data from User (${lineage.dataKey})`;
      } else if (lineage.sourceType === "tool_output") {
        sourceNodeId = `tool_output_${lineage.sourceId}`;
        edgeLabel = `Output from Tool (${lineage.dataKey})`;
      } else {
        sourceNodeId = "unknown_source";
        edgeLabel = "Unknown Source";
      }

      if (lineage.targetType === "tool_input") {
        targetNodeId = `tool_input_${lineage.targetId}`;
        edgeLabel = `Input to Tool (${lineage.dataKey})`;
      } else {
        targetNodeId = "unknown_target";
        edgeLabel = "Unknown Target";
      }

      edges.push({
        source: sourceNodeId,
        target: targetNodeId,
        label: edgeLabel,
        lineage: lineage,
      });
    });

    return { nodes: nodes, edges: edges };
  }

  public renderGraph(payload: DependencyGraphPayload): {
    nodes: Record<string, { type: string; label: string; details: any }>;
    edges: { source: string; target: string; label: string; lineage: DataLineage | null }[];
  } {
    return this.buildGraphStructure(payload);
  }
}