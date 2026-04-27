import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface NodeData {
  id: string;
  label: string;
  type: "agent" | "tool";
  position: { x: number; y: number };
}

export interface ResourceConstraint {
  resourceId: string;
  nodeId: string;
  startTime: number;
  endTime: number;
  limit: number;
}

export interface TemporalDependencyEdge {
  sourceId: string;
  targetId: string;
  startTime: number;
  endTime: number;
  resourceUsage?: {
    resourceId: string;
    usage: number;
  };
}

export class DependencyGraphVisualizerV14 {
  private nodes: NodeData[];
  private edges: TemporalDependencyEdge[];
  private constraints: ResourceConstraint[];

  constructor(nodes: NodeData[], edges: TemporalDependencyEdge[], constraints: ResourceConstraint[]) {
    this.nodes = nodes;
    this.edges = edges;
    this.constraints = constraints;
  }

  public visualize(): {
    nodes: any[];
    edges: any[];
    resourceZones: any[];
  } {
    const renderedNodes = this.nodes.map(node => ({
      id: node.id,
      label: node.label,
      position: node.position,
      // Placeholder for rendering logic
    }));

    const renderedEdges = this.edges.map(edge => ({
      source: this.nodes.find(n => n.id === edge.sourceId)?.position,
      target: this.nodes.find(n => n.id === edge.targetId)?.position,
      // Temporal rendering logic (e.g., curved/segmented line)
      temporal: {
        start: edge.startTime,
        end: edge.endTime,
      },
      resource: edge.resourceUsage,
    }));

    const resourceZones = this.renderResourceConstraints();

    return {
      nodes: renderedNodes,
      edges: renderedEdges,
      resourceZones: resourceZones,
    };
  }

  private renderResourceConstraints(): any[] {
    const zones: any[] = [];
    for (const constraint of this.constraints) {
      zones.push({
        resourceId: constraint.resourceId,
        nodeId: constraint.nodeId,
        start: constraint.startTime,
        end: constraint.endTime,
        limit: constraint.limit,
        // Color coding logic based on utilization vs limit
        color: this.calculateConstraintColor(constraint),
      });
    }
    return zones;
  }

  private calculateConstraintColor(constraint: ResourceConstraint): string {
    // Simple heuristic: if utilization is near limit, warn yellow/red
    const utilizationRatio = constraint.limit > 0 ? 1 / (constraint.limit / 10) : 0;
    if (utilizationRatio > 0.8) {
      return "red";
    }
    if (utilizationRatio > 0.4) {
      return "yellow";
    }
    return "green";
  }
}