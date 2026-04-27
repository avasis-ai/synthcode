import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface GraphNode {
  id: string;
  label: string;
  type: "process" | "resource";
  metadata: Record<string, unknown>;
}

export interface TemporalGraphData {
  nodes: GraphNode[];
  edges: {
    source: string;
    target: string;
    startTime: number;
    endTime: number;
    resourceConstraint?: string;
  }[];
}

export class DependencyGraphVisualizerV32 {
  private graphData: TemporalGraphData;

  constructor(initialData: TemporalGraphData) {
    this.graphData = initialData;
  }

  private calculateForceLayout(nodes: GraphNode[], edges: any[]): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    // Simplified force-directed layout simulation for demonstration
    // In a real implementation, this would use physics simulation (e.g., D3-force)
    nodes.forEach((node, index) => {
      positions.set(node.id, {
        x: (index % 5) * 150,
        y: Math.floor(index / 5) * 100,
      });
    });
    return positions;
  }

  private getEdgeVisualProperties(edge: {
    source: string;
    target: string;
    startTime: number;
    endTime: number;
    resourceConstraint?: string;
  }): {
    thickness: number;
    color: string;
    isContended: boolean;
  } {
    const duration = edge.endTime - edge.startTime;
    const thickness = Math.min(5, 10 + duration / 5000);
    const color = edge.resourceConstraint ? "red" : "blue";
    // Simple contention check: if duration is very short relative to others
    const isContended = duration < 1000;
    return { thickness, color, isContended };
  }

  public renderGraph(data: TemporalGraphData): {
    layout: Map<string, { x: number; y: number }>;
    visualElements: {
      nodes: { id: string; x: number; y: number; label: string; type: string };
      edges: {
        source: string;
        target: string;
        thickness: number;
        color: string;
        isContended: boolean;
      }[];
    };
  } {
    this.graphData = data;
    const positions = this.calculateForceLayout(data.nodes, data.edges);

    const visualElements = {
      nodes: data.nodes.map((node) => ({
        id: node.id,
        x: positions.get(node.id)!.x,
        y: positions.get(node.id)!.y,
        label: node.label,
        type: node.type,
      })),
      edges: data.edges.map((edge) => {
        const props = this.getEdgeVisualProperties(edge);
        return {
          source: edge.source,
          target: edge.target,
          thickness: props.thickness,
          color: props.color,
          isContended: props.isContended,
        };
      }),
    };

    return { layout: positions, visualElements: visualElements };
  }
}