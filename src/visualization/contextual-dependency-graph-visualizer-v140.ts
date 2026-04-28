import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface DependencyEdge {
  sourceId: string;
  targetId: string;
  temporalProximityScore: number;
  resourceOverlapScore: number;
}

interface DependencyGraph {
  nodes: Record<string, { label: string; attributes: Record<string, unknown> }>;
  edges: DependencyEdge[];
}

interface VisualizationConfig {
  focus: "temporal" | "resource" | "all";
  temporalWeight: number;
  resourceWeight: number;
  minEdgeThickness: number;
  maxEdgeThickness: number;
  opacityScaleFactor: number;
}

export class ContextualDependencyGraphVisualizer {
  private graph: DependencyGraph;
  private config: VisualizationConfig;

  constructor(graph: DependencyGraph, config: Partial<VisualizationConfig> = {}) {
    this.graph = graph;
    this.config = {
      focus: "all",
      temporalWeight: 0.5,
      resourceWeight: 0.5,
      minEdgeThickness: 1,
      maxEdgeThickness: 5,
      opacityScaleFactor: 0.8,
      ...config,
    };
  }

  private calculateEdgeScore(edge: DependencyEdge): number {
    const { temporalProximityScore, resourceOverlapScore } = edge;
    const { temporalWeight, resourceWeight } = this.config;

    return (temporalProximityScore * temporalWeight) + (resourceOverlapScore * resourceWeight);
  }

  private getEdgeStyle(edge: DependencyEdge): { opacity: number; thickness: number } {
    const score = this.calculateEdgeScore(edge);
    const { minEdgeThickness, maxEdgeThickness, opacityScaleFactor } = this.config;

    const normalizedScore = Math.min(1, Math.max(0, score));
    const thickness = minEdgeThickness + normalizedScore * (maxEdgeThickness - minEdgeThickness);
    const opacity = opacityScaleFactor * (0.3 + normalizedScore * 0.7);

    return { opacity: opacity, thickness: thickness };
  }

  private getNodeStyle(nodeId: string): { opacity: number; size: number } {
    // Placeholder: In a real scenario, node style would depend on node attributes
    // and the visualization focus.
    return { opacity: 1.0, size: 10 };
  }

  public visualize(): { nodes: Record<string, { style: { opacity: number; size: number }; label: string }>; edges: Record<string, { style: { opacity: number; thickness: number }; edge: DependencyEdge }>; } {
    const styledNodes: Record<string, { style: { opacity: number; size: number }; label: string }> = {};
    const styledEdges: Record<string, { style: { opacity: number; thickness: number }; edge: DependencyEdge }> = {};

    for (const nodeId in this.graph.nodes) {
      const node = this.graph.nodes[nodeId];
      styledNodes[nodeId] = {
        style: this.getNodeStyle(nodeId),
        label: node.label,
      };
    }

    for (const edge of this.graph.edges) {
      const { style: edgeStyle } = this.getEdgeStyle(edge);
      const edgeKey = `${edge.sourceId}-${edge.targetId}`;
      styledEdges[edgeKey] = {
        style: edgeStyle,
        edge: edge,
      };
    }

    return {
      nodes: styledNodes,
      edges: styledEdges,
    };
  }
}