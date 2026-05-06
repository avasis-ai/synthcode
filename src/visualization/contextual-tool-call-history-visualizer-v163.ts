import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ToolCallHistory {
  tool_call_id: string;
  tool_name: string;
  input: Record<string, unknown>;
  context_payload: Record<string, unknown>;
  output_content: string;
  is_error: boolean;
}

export interface VisualGraphNode {
  id: string;
  type: "call" | "context" | "message";
  data: any;
  connections: { targetId: string; relationship: "input" | "output" | "context_flow" }[];
}

export interface VisualGraphEdge {
  sourceId: string;
  targetId: string;
  relationship: "input" | "output" | "context_flow";
}

export class ContextualToolCallHistoryVisualizer {
  private history: Message[];
  private toolCallHistory: ToolCallHistory[];

  constructor(history: Message[], toolCallHistory: ToolCallHistory[]) {
    this.history = history;
    this.toolCallHistory = toolCallHistory;
  }

  private buildGraphNodes(): VisualGraphNode[] {
    const nodes: VisualGraphNode[] = [];
    const nodeMap = new Map<string, VisualGraphNode>();

    // 1. Process Message History Nodes
    this.history.forEach((message, index) => {
      const nodeId = `msg_${index}`;
      let nodeData: any;
      let nodeType: "message";

      if (message.role === "user") {
        nodeData = { type: "user", content: message as { role: "user", content: string } };
      } else if (message.role === "assistant") {
        nodeData = { type: "assistant", content: message as { role: "assistant", content: ContentBlock[] } };
      } else if (message.role === "tool") {
        // Tool result messages are complex, we'll use the tool result ID as primary key
        const toolResult = message as { role: "tool", tool_use_id: string, content: string, is_error?: boolean };
        nodeData = { type: "tool_result", tool_use_id: toolResult.tool_use_id, content: toolResult.content, is_error: toolResult.is_error };
        nodeType = "message"; // Treat tool result as a message node for simplicity in traversal
      } else {
        nodeData = { type: "unknown", content: message };
      }

      const node: VisualGraphNode = {
        id: nodeId,
        type: nodeType,
        data: nodeData,
        connections: [],
      };
      nodes.push(node);
      nodeMap.set(nodeId, node);
    });

    // 2. Process Tool Call History Nodes (Inputs/Context)
    this.toolCallHistory.forEach((tch, index) => {
      const nodeId = `tch_${tch.tool_call_id}_${index}`;
      const node: VisualGraphNode = {
        id: nodeId,
        type: "call",
        data: {
          tool_name: tch.tool_name,
          input: tch.input,
          context_payload: tch.context_payload,
          output_content: tch.output_content,
          is_error: tch.is_error,
        },
        connections: [],
      };
      nodes.push(node);
      nodeMap.set(nodeId, node);
    });

    return nodes;
  }

  private buildGraphEdges(nodes: VisualGraphNode[]): VisualGraphEdge[] {
    const edges: VisualGraphEdge[] = [];

    // Simple connection logic: Link tool calls to the message that triggered them,
    // and link tool results back to the message that received them.

    // For demonstration, we'll assume the first tool call relates to the first user message,
    // and the first tool result relates to the next assistant message.
    if (this.toolCallHistory.length > 0 && this.history.length > 0) {
      // Link first tool call to the first user message
      const firstCallId = `tch_${this.toolCallHistory[0].tool_call_id}_0`;
      const firstMsgId = `msg_0`;
      edges.push({ sourceId: firstMsgId, targetId: firstCallId, relationship: "input" });
    }

    if (this.toolCallHistory.length > 0 && this.history.length > 1) {
      // Link tool output (result) to the subsequent message node
      const lastCallId = `tch_${this.toolCallHistory[this.toolCallHistory.length - 1].tool_call_id}_${this.toolCallHistory.length - 1}`;
      const lastMsgId = `msg_${this.history.length - 1}`;
      edges.push({ sourceId: lastCallId, targetId: lastMsgId, relationship: "output" });
    }

    return edges;
  }

  public visualize(): { nodes: VisualGraphNode[]; edges: VisualGraphEdge[] } {
    const nodes = this.buildGraphNodes();
    const edges = this.buildGraphEdges(nodes);
    return { nodes, edges };
  }
}