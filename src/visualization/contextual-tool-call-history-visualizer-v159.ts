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

export interface ToolCallHistoryItem {
  message: Message;
  tool_call_id: string;
  dependencies: {
    source_id: string;
    target_id: string;
    type: "dependency" | "temporal";
  }[];
  resource_usage: {
    metric: string;
    value: number;
  }[];
}

export interface ContextualHistoryPayload {
  history: ToolCallHistoryItem[];
}

export class ContextualToolCallHistoryVisualizer {
  private payload: ContextualHistoryPayload;

  constructor(payload: ContextualHistoryPayload) {
    this.payload = payload;
  }

  public visualize(): { nodes: any[]; edges: any[] } {
    const nodes: any[] = [];
    const edges: any[] = [];

    this.payload.history.forEach((item, index) => {
      const nodeId = `call_${index}`;
      nodes.push({
        id: nodeId,
        label: `Call ${index + 1}`,
        type: "tool_call_node",
        data: {
          message: item.message,
          tool_call_id: item.tool_call_id,
          resource_usage: item.resource_usage,
        },
        position: { x: index * 100, y: 0 },
      });

      // Add dependency/temporal edges
      item.dependencies.forEach((dep) => {
        edges.push({
          source: nodeId,
          target: dep.source_id === nodeId ? dep.target_id : dep.source_id,
          targetId: dep.source_id === nodeId ? dep.source_id : dep.target_id,
          type: dep.type,
          label: `${dep.type} link`,
        });
      });
    });

    return { nodes, edges };
  }
}