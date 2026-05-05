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

export interface ToolCallHistory {
  callId: string;
  toolName: string;
  input: Record<string, unknown>;
  output: string;
  causality: string;
  stateChange?: Record<string, any>;
}

export interface ToolCallHistoryPayload {
  history: ToolCallHistory[];
  initialContext: Record<string, any>;
}

export class ContextualToolCallHistoryVisualizer {
  constructor(private payload: ToolCallHistoryPayload) {}

  public renderVisualization(): { nodes: any[]; edges: any[] } {
    const nodes: any[] = [];
    const edges: any[] = [];

    const initialContextNode = {
      id: "context-start",
      label: "Initial Context",
      type: "context",
      data: this.payload.initialContext,
    };
    nodes.push(initialContextNode);

    let lastNodeId = "context-start";

    this.payload.history.forEach((call, index) => {
      const nodeId = `call-${index}-${call.callId}`;
      nodes.push({
        id: nodeId,
        label: `${call.toolName} (Call ${index + 1})`,
        type: "tool_call",
        data: {
          input: call.input,
          output: call.output,
          causality: call.causality,
          stateChange: call.stateChange,
        },
      });

      // Edge from previous step to current call
      edges.push({
        source: lastNodeId,
        target: nodeId,
        value: "Causality Flow",
        type: "dependency",
      });

      lastNodeId = nodeId;
    });

    // Add final state node
    const finalNodeId = "context-end";
    nodes.push({
      id: finalNodeId,
      label: "Final State",
      type: "context",
      data: { final: true },
    });

    // Edge from last call to final state
    if (this.payload.history.length > 0) {
      edges.push({
        source: `call-${this.payload.history.length - 1}-${this.payload.history[this.payload.history.length - 1].callId}`,
        target: finalNodeId,
        value: "Completion",
        type: "completion",
      });
    }

    return { nodes, edges };
  }
}