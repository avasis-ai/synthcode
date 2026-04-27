import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface TemporalNode {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  resourceUsage: Record<string, number>;
  metadata: Record<string, any>;
}

export interface TemporalEdge {
  sourceId: string;
  targetId: string;
  startTime: number;
  endTime: number;
  dependencyType: "causal" | "resource_constrained" | "sequential";
  weight: number;
}

export interface DependencyGraphPayload {
  nodes: TemporalNode[];
  edges: TemporalEdge[];
}

export class ToolExecutionDependencyVisualizer {
  private graphPayload: DependencyGraphPayload;

  constructor(graphPayload: DependencyGraphPayload) {
    this.graphPayload = graphPayload;
  }

  private mapTemporalMetadata(node: TemporalNode): {
    style: React.CSSProperties;
    position: { x: number; y: number };
  } {
    const duration = node.endTime - node.startTime;
    const baseOpacity = Math.min(1, duration / 1000);
    const colorIntensity = Math.max(0.2, Math.min(1, node.resourceUsage["cpu"] || 0.5));

    return {
      style: {
        opacity: baseOpacity,
        backgroundColor: `rgba(50, 150, 255, ${colorIntensity})`,
        borderColor: `rgba(50, 100, 200, ${colorIntensity * 1.2})`,
        transition: "all 0.3s ease",
      },
      position: {
        x: node.startTime * 0.1,
        y: node.metadata.verticalPosition || 0,
      },
    };
  }

  private mapTemporalEdgeMetadata(edge: TemporalEdge): {
    style: React.CSSProperties;
    curve: string;
  } {
    let color: string;
    switch (edge.dependencyType) {
      case "causal":
        color = "red";
        break;
      case "resource_constrained":
        color = "orange";
        break;
      case "sequential":
      default:
        color = "blue";
        break;
    }

    return {
      style: {
        stroke: color,
        strokeWidth: Math.max(1, edge.weight * 0.5),
        opacity: Math.min(0.8, edge.weight * 0.5),
      },
      curve: "catmull-rom",
    };
  }

  public visualize(): {
    nodesVisual: {
      id: string;
      style: React.CSSProperties;
      position: { x: number; y: number };
    }[];
    edgesVisual: {
      id: string;
      style: React.CSSProperties;
      curve: string;
    }[];
  } {
    const nodesVisual = this.graphPayload.nodes.map(node => ({
      id: node.id,
      style: this.mapTemporalMetadata(node).style,
      position: this.mapTemporalMetadata(node).position,
    }));

    const edgesVisual = this.graphPayload.edges.map(edge => ({
      id: `${edge.sourceId}-${edge.targetId}`,
      style: this.mapTemporalEdgeMetadata(edge).style,
      curve: this.mapTemporalEdgeMetadata(edge).curve,
    }));

    return {
      nodesVisual,
      edgesVisual,
    };
  }
}