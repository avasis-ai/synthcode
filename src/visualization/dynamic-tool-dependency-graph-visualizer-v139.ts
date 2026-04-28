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

export interface GraphNode {
  id: string;
  type: "tool" | "user" | "assistant";
  label: string;
  startTime: number;
  endTime: number;
  resourceUsage: Record<string, number>;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  dependencyType: "sequential" | "resource_constrained" | "causal";
  weight: number;
}

export interface EnrichedGraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    timelineScale: number;
    resourceCapacity: Record<string, number>;
  };
}

export class DynamicToolDependencyGraphVisualizer {
  private payload: EnrichedGraphPayload;

  constructor(payload: EnrichedGraphPayload) {
    this.payload = payload;
  }

  private mapNodeToVisualComponent(node: GraphNode): any {
    const baseStyle: Record<string, any> = {
      size: `${Math.max(20, (node.endTime - node.startTime) / 100)}px`,
      backgroundColor: this.getNodeColor(node.type),
      opacity: 0.9,
      transition: "all 0.3s ease",
    };

    let positionStyle: Record<string, any> = {};
    if (node.type === "tool") {
      positionStyle = {
        left: `${node.startTime * 0.1}vw`,
        top: `${node.resourceUsage["cpu"] * 10}%`,
      };
    } else {
      positionStyle = {
        left: `${(node.id.charCodeAt(0) % 10) * 10}%`,
        top: `${(node.id.charCodeAt(0) % 5) * 20}%`,
      };
    }

    return {
      ...baseStyle,
      ...positionStyle,
      data: node,
    };
  }

  private mapEdgeToVisualComponent(edge: GraphEdge): any {
    let strokeColor: string = "#ccc";
    if (edge.dependencyType === "resource_constrained") {
      strokeColor = "red";
    } else if (edge.dependencyType === "causal") {
      strokeColor = "blue";
    }

    return {
      stroke: strokeColor,
      strokeWidth: edge.weight * 2,
      curve: "catmull-rom",
    };
  }

  private getNodeColor(type: GraphNode["type"]): string {
    switch (type) {
      case "tool":
        return "#4CAF50";
      case "user":
        return "#2196F3";
      case "assistant":
        return "#FF9800";
      default:
        return "#9E9E9E";
    }
  }

  public renderGraph(): { nodes: any[]; edges: any[] } {
    const visualNodes = this.payload.nodes.map(this.mapNodeToVisualComponent);
    const visualEdges = this.payload.edges.map(this.mapEdgeToVisualComponent);

    return {
      nodes: visualNodes,
      edges: visualEdges,
    };
  }
}