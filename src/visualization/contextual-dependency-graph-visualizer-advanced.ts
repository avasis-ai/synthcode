import {
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
  usage: number; // e.g., CPU percentage, memory usage
  threshold: number;
}

export interface TemporalConstraint {
  startTime: number; // Unix timestamp or relative time unit
  endTime: number;   // Unix timestamp or relative time unit
  decayRate?: number; // For visualizing decay over time
}

export interface DependencyNode {
  id: string;
  label: string;
  data: Record<string, unknown>;
  temporal?: TemporalConstraint[];
  resources?: ResourceConstraint[];
}

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  weight: number; // Standard weight
  temporal?: TemporalConstraint[];
  resources?: ResourceConstraint[];
}

export interface GraphPayload {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export class ContextualDependencyGraphVisualizerAdvanced {
  private payload: GraphPayload;

  constructor(payload: GraphPayload) {
    this.payload = payload;
  }

  private getResourceColor(resource: ResourceConstraint): string {
    const ratio = resource.usage / resource.threshold;
    if (ratio >= 1.5) return "red";
    if (ratio >= 1.0) return "orange";
    return "green";
  }

  private getNodeVisualStyle(node: DependencyNode): { backgroundColor: string; border: string } {
    let baseColor = "#3498db";
    let borderStyle = "solid";

    if (node.resources && node.resources.length > 0) {
      const maxResource = node.resources.reduce(
        (max, res) => Math.max(max, res.usage / res.threshold),
        0
      );
      const color = this.getResourceColor({
        resourceName: "Overall",
        usage: maxResource * 1.1,
        threshold: 1.0,
      });
      baseColor = color === "red" ? "#e74c3c" : color === "orange" ? "#f39c12" : "#2ecc71";
    }

    return { backgroundColor: baseColor, border: `${borderStyle} 2px solid #2c3e50` };
  }

  private getEdgeVisualStyle(edge: DependencyEdge): { strokeColor: string; thickness: number } {
    let baseColor = "#95a5a6";
    let thickness = Math.max(1, Math.round(edge.weight * 2));

    if (edge.resources && edge.resources.length > 0) {
      const maxResource = edge.resources.reduce(
        (max, res) => Math.max(max, res.usage / res.threshold),
        0
      );
      const color = this.getResourceColor({
        resourceName: "Overall",
        usage: maxResource * 1.1,
        threshold: 1.0,
      });
      baseColor = color;
    }

    return { strokeColor: baseColor, thickness: thickness };
  }

  public visualize(): { nodes: { id: string; style: { backgroundColor: string; border: string } }; edges: { source: string; target: string; style: { strokeColor: string; thickness: number } } } {
    const nodeStyles = this.payload.nodes.map(node => ({
      id: node.id,
      style: this.getNodeVisualStyle(node),
    }));

    const edgeStyles = this.payload.edges.map(edge => ({
      source: edge.sourceId,
      target: edge.targetId,
      style: this.getEdgeVisualStyle(edge),
    }));

    return { nodes: nodeStyles, edges: edgeStyles };
  }
}