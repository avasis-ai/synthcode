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

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface ToolCallResult {
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface ToolCallHistoryPayload {
  messages: Message[];
  tool_calls: ToolCall[];
  tool_results: ToolCallResult[];
}

interface NodeData {
  id: string;
  type: "call" | "result" | "message";
  data: any;
  position: { x: number; y: number };
}

interface EdgeData {
  sourceId: string;
  targetId: string;
  type: "dependency" | "result_flow";
}

export class ContextualToolCallHistoryVisualizer {
  private payload: ToolCallHistoryPayload;

  constructor(payload: ToolCallHistoryPayload) {
    this.payload = payload;
  }

  private extractNodesAndEdges(): { nodes: NodeData[]; edges: EdgeData[] } {
    const nodes: NodeData[] = [];
    const edges: EdgeData[] = [];
    const nodeMap: Map<string, NodeData> = new Map();

    // 1. Process Tool Calls (Source Nodes)
    this.payload.tool_calls.forEach((call, index) => {
      const nodeId = `call_${index}`;
      const node: NodeData = {
        id: nodeId,
        type: "call",
        data: { name: call.name, input: call.input },
        position: { x: 0, y: 0 }, // Placeholder
      };
      nodes.push(node);
      nodeMap.set(call.id, node);
    });

    // 2. Process Tool Results (Target Nodes)
    this.payload.tool_results.forEach((result, index) => {
      const nodeId = `result_${index}`;
      const node: NodeData = {
        id: nodeId,
        type: "result",
        data: { content: result.content, is_error: result.is_error },
        position: { x: 0, y: 0 }, // Placeholder
      };
      nodes.push(node);
      nodeMap.set(result.tool_use_id, node);
    });

    // 3. Process Message History (Context Nodes)
    this.payload.messages.forEach((message, index) => {
      const nodeId = `msg_${index}`;
      let node: NodeData;
      if (message.role === "user") {
        node = {
          id: nodeId,
          type: "message",
          data: { role: "user", content: message.content.map(block => block.text).join("") },
          position: { x: 0, y: 0 },
        };
      } else if (message.role === "assistant") {
        node = {
          id: nodeId,
          type: "message",
          data: { role: "assistant", content: message.content.map(block => block.text).join("") },
          position: { x: 0, y: 0 },
        };
      } else if (message.role === "tool") {
        // ToolResultMessage is already handled by tool_results, but we keep this for structure completeness
        node = {
          id: nodeId,
          type: "message",
          data: { role: "tool", tool_use_id: message.tool_use_id, content: message.content },
          position: { x: 0, y: 0 },
        };
      } else {
        return;
      }
      nodes.push(node);
      nodeMap.set(nodeId, node);
    });

    // 4. Establish Edges (Dependencies/Flow)
    // Simple flow: Tool Call -> Tool Result
    this.payload.tool_calls.forEach((call, callIndex) => {
      const callNodeId = `call_${callIndex}`;
      const callId = call.id;

      // Find the corresponding result for this call
      const result = this.payload.tool_results.find(r => r.tool_use_id === callId);

      if (result) {
        const resultNodeId = `result_${this.payload.tool_results.indexOf(result)}`;
        edges.push({
          sourceId: callNodeId,
          targetId: resultNodeId,
          type: "result_flow",
        });
      }
    });

    // In a real implementation, we would calculate positions here based on sequence/dependencies.
    // For this structure, we return the raw components.
    return { nodes, edges };
  }

  public visualize(): { nodes: NodeData[]; edges: EdgeData[] } {
    return this.extractNodesAndEdges();
  }
}