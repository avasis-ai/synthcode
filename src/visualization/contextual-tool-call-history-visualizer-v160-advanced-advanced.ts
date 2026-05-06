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

export interface ResourceMetric {
  resourceName: string;
  usageValue: number;
  timestamp: number;
}

export interface StateChange {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

export interface ToolCallHistoryPayload {
  messages: Message[];
  resourceMetrics: ResourceMetric[];
  stateChanges: StateChange[];
  temporalMetadata: {
    startTime: number;
    endTime: number;
  };
}

export interface GraphNode {
  id: string;
  type: "message" | "tool_call" | "state_change" | "resource_metric";
  data: any;
  position: { x: number; y: number };
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  type: "dependency" | "temporal" | "state_flow";
  weight: number;
}

export class ContextualToolCallHistoryVisualizer {
  private payload: ToolCallHistoryPayload;

  constructor(payload: ToolCallHistoryPayload) {
    this.payload = payload;
  }

  private buildGraphNodes(): GraphNode[] {
    const nodes: GraphNode[] = [];
    let nodeIdCounter = 0;

    const addNode = (type: GraphNode["type"], data: any): GraphNode => {
      const id = `node-${nodeIdCounter++}`;
      return {
        id,
        type,
        data,
        position: { x: 0, y: 0 }, // Placeholder, actual layout engine handles this
      };
    };

    // 1. Message Nodes
    this.payload.messages.forEach((message, index) => {
      let messageData: any = { role: message.role, content: message };
      if (message.role === "assistant") {
        messageData.contentBlocks = message.content;
      } else if (message.role === "tool") {
        messageData.toolUseId = message.tool_use_id;
      }
      nodes.push(addNode("message", messageData));
    });

    // 2. Resource Metric Nodes
    this.payload.resourceMetrics.forEach((metric, index) => {
      nodes.push(addNode("resource_metric", metric));
    });

    // 3. State Change Nodes
    this.payload.stateChanges.forEach((change, index) => {
      nodes.push(addNode("state_change", change));
    });

    return nodes;
  }

  private buildGraphEdges(): GraphEdge[] {
    const edges: GraphEdge[] = [];
    const nodes = this.buildGraphNodes();

    // Simple dependency edges: Message -> Tool Call (if applicable)
    for (let i = 0; i < this.payload.messages.length; i++) {
      const message = this.payload.messages[i];
      if (message.role === "assistant") {
        const contentBlocks = message.content as ContentBlock[];
        contentBlocks.forEach((block, blockIndex) => {
          if (block.type === "tool_use") {
            const toolUseBlock = block as ToolUseBlock;
            // In a real scenario, we'd link this to the subsequent tool result message
            // For simplicity, we create a conceptual dependency edge.
            edges.push({
              sourceId: `node-message-${i}`, // Conceptual source ID
              targetId: `node-tool-use-${toolUseBlock.id}`, // Conceptual target ID
              type: "dependency",
              weight: 1.0,
            });
          }
        });
      }
    }

    // Temporal edges: Link sequential events
    for (let i = 0; i < this.payload.messages.length - 1; i++) {
      edges.push({
        sourceId: `node-message-${i}`,
        targetId: `node-message-${i + 1}`,
        type: "temporal",
        weight: 1.0,
      });
    }

    // State flow edges: Link state changes to the event that caused them (simplified)
    for (let i = 0; i < this.payload.stateChanges.length; i++) {
      edges.push({
        sourceId: `node-state-change-${i}`,
        targetId: `node-message-any`, // Target needs refinement based on context
        type: "state_flow",
        weight: 0.5,
      });
    }

    return edges;
  }

  public visualize(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes = this.buildGraphNodes();
    const edges = this.buildGraphEdges();
    return { nodes, edges };
  }
}