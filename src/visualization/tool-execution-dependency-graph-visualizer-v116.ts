import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ResourceMetadata {
  resourceName: string;
  usageUnits: number;
  maxCapacity: number;
}

export interface TemporalConstraint {
  startTimeMs: number;
  endTimeMs: number;
  dependencyOrder: number;
}

export interface EnrichedGraphNode {
  id: string;
  label: string;
  type: "tool" | "user_input" | "system";
  metadata: {
    resources: ResourceMetadata[];
    temporal: TemporalConstraint;
  };
}

export interface EnrichedGraphEdge {
  sourceId: string;
  targetId: string;
  relationshipType: "calls" | "depends_on" | "follows";
  metadata: {
    latencyMs: number;
    dependencyWeight: number;
  };
}

export interface EnrichedGraphPayload {
  nodes: EnrichedGraphNode[];
  edges: EnrichedGraphEdge[];
}

export interface VisualizationPayload {
  nodes: { id: string; x: number; y: number; data: any };
  links: { source: string; target: string; value: number };
}

export class ToolExecutionDependencyGraphVisualizer {
  private payload: EnrichedGraphPayload;

  constructor(payload: EnrichedGraphPayload) {
    this.payload = payload;
  }

  private calculateNodePositions(nodes: EnrichedGraphNode[]): Record<string, { x: number; y: number }> {
    const positions: Record<string, { x: number; y: number }> = {};
    const count = nodes.length;
    const radius = 300;
    const centerX = 800;
    const centerY = 300;

    nodes.forEach((node, index) => {
      const angle = (index / count) * 2 * Math.PI;
      positions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
    return positions;
  }

  private mapNodesToVisualization(nodes: EnrichedGraphNode[], positions: Record<string, { x: number; y: number }>): { id: string; x: number; y: number; data: any }[] {
    return nodes.map((node, index) => ({
      id: node.id,
      x: positions[node.id]!.x,
      y: positions[node.id]!.y,
      data: {
        label: node.label,
        type: node.type,
        resourceUsage: node.metadata.resources.map(r => r.resourceName).join(", "),
        temporalSpan: `${node.metadata.temporal.startTimeMs}-${node.metadata.temporal.endTimeMs}`,
      },
    }));
  }

  private mapEdgesToVisualization(edges: EnrichedGraphEdge[], positions: Record<string, { x: number; y: number }>): { source: string; target: string; value: number }[] {
    return edges.map((edge) => ({
      source: edge.sourceId,
      target: edge.targetId,
      value: edge.metadata.dependencyWeight,
    }));
  }

  public visualize(): VisualizationPayload {
    const nodePositions = this.calculateNodePositions(this.payload.nodes);

    const visualizedNodes = this.mapNodesToVisualization(this.payload.nodes, nodePositions);
    const visualizedLinks = this.mapEdgesToVisualization(this.payload.edges, nodePositions);

    return {
      nodes: visualizedNodes,
      links: visualizedLinks,
    };
  }
}