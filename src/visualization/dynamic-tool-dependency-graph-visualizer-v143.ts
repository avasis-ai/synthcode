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
  limit: number;
  unit: "cpu" | "memory" | "disk";
}

export interface TemporalMetadata {
  startTime: number;
  endTime: number;
  durationMs: number;
}

export interface ToolDependencyNode {
  id: string;
  name: string;
  type: "tool_call" | "tool_result" | "user_input" | "system";
  metadata: {
    description: string;
    resources?: ResourceConstraint[];
    temporal?: TemporalMetadata;
  };
}

export interface ToolDependencyEdge {
  fromId: string;
  toId: string;
  relationship: "calls" | "depends_on" | "follows";
  weight: number;
}

export interface DynamicGraphPayload {
  nodes: ToolDependencyNode[];
  edges: ToolDependencyEdge[];
  executionFlow: {
    history: Message[];
    currentStep: {
      nodeId: string;
      status: "running" | "completed" | "failed";
    };
  };
}

export class DynamicToolDependencyGraphVisualizer {
  private payload: DynamicGraphPayload;

  constructor(payload: DynamicGraphPayload) {
    this.payload = payload;
  }

  private mapNodeToVisualComponent(node: ToolDependencyNode): any {
    const baseStyle = {
      padding: "10px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      textAlign: "center",
    };

    let specificStyle: any = {};
    let content: string = "";

    switch (node.type) {
      case "tool_call":
        specificStyle = { backgroundColor: "#e0f7fa", border: "2px solid #00bcd4" };
        content = `Tool: ${node.name}<br/>${node.metadata.description || ""}`;
        break;
      case "tool_result":
        specificStyle = { backgroundColor: "#e8f5e9", border: "2px solid #4caf50" };
        content = `Result for ${node.name}<br/>Status: ${node.metadata.description || "Success"}`;
        break;
      case "user_input":
        specificStyle = { backgroundColor: "#f3e5f5", border: "2px solid #9c27b0" };
        content = `User Input: ${node.name}`;
        break;
      case "system":
        specificStyle = { backgroundColor: "#fff3e0", border: "2px solid #ff9800" };
        content = `System Context: ${node.name}`;
        break;
    }

    return {
      style: { ...baseStyle, ...specificStyle },
      content: content,
      data: node,
    };
  }

  private mapEdgeToVisualComponent(edge: ToolDependencyEdge): any {
    let color: string = "#ccc";
    if (edge.relationship === "calls") {
      color = "#2196f3";
    } else if (edge.relationship === "depends_on") {
      color = "#ff9800";
    } else if (edge.relationship === "follows") {
      color = "#4caf50";
    }

    return {
      type: "connector",
      style: { stroke: color, strokeWidth: "2px", transition: "all 0.3s ease" },
      data: edge,
    };
  }

  public renderGraph(): { nodes: any[]; edges: any[] } {
    const visualNodes = this.payload.nodes.map(this.mapNodeToVisualComponent);
    const visualEdges = this.payload.edges.map(this.mapEdgeToVisualComponent);

    return {
      nodes: visualNodes,
      edges: visualEdges,
    };
  }

  public getExecutionStatusDisplay(): string {
    const { history, currentStep } = this.payload.executionFlow;
    let statusHtml = "<h3>Execution Flow History</h3><ul>";

    history.forEach((message, index) => {
      statusHtml += `<li>[${index + 1}] Role: ${message.role}</li>`;
    });

    statusHtml += `</ul><h3>Current Step: ${currentStep.nodeId} (${currentStep.status})</h3>`;
    return statusHtml;
  }
}