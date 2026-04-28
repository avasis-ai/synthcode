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

export interface ResourceMetadata {
  resourceName: string;
  requiredAmount: number;
  unit: string;
}

export interface TemporalMetadata {
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
}

export interface DependencyNode {
  id: string;
  type: "tool_call" | "user_input" | "system_state";
  metadata: {
    name: string;
    description: string;
  };
  temporal: TemporalMetadata;
  resources: ResourceMetadata[];
}

export interface DependencyEdge {
  fromNodeId: string;
  toNodeId: string;
  dependencyType: "sequential" | "conditional" | "data_flow";
  temporal: TemporalMetadata;
  resourceConstraint: ResourceMetadata | null;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export class ToolExecutionDependencyGraphVisualizer {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private calculateBottlenecks(edges: DependencyEdge[]): {
    edgeId: string;
    bottleneck: ResourceMetadata;
  }[] {
    const bottlenecks: {
      edgeId: string;
      bottleneck: ResourceMetadata;
    }[] = [];

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      if (edge.resourceConstraint) {
        bottlenecks.push({
          edgeId: `${edge.fromNodeId}->${edge.toNodeId}`,
          bottleneck: edge.resourceConstraint,
        });
      }
    }
    return bottlenecks;
  }

  private prioritizeTemporalLinks(edges: DependencyEdge[]): {
    edgeId: string;
    priority: number;
  }[] {
    const priorities: {
      edgeId: string;
      priority: number;
    }[] = [];

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      // Higher priority for edges with significant temporal gaps or resource constraints
      const durationRatio = edge.temporal.durationMs / 1000;
      const priority = Math.round(durationRatio * 10) + (edge.resourceConstraint ? 10 : 0);
      priorities.push({
        edgeId: `${edge.fromNodeId}->${edge.toNodeId}`,
        priority: priority,
      });
    }
    return priorities;
  }

  public visualize(
    graph: DependencyGraph,
    messageHistory: Message[],
  ): {
    visualizationData: any;
    bottlenecks: {
      edgeId: string;
      bottleneck: ResourceMetadata;
    }[];
    prioritizedEdges: {
      edgeId: string;
      priority: number;
    }[];
  } {
    const bottlenecks = this.calculateBottlenecks(graph.edges);
    const prioritizedEdges = this.prioritizeTemporalLinks(graph.edges);

    const visualizationData = {
      nodes: graph.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        label: node.metadata.name,
        details: {
          description: node.metadata.description,
          temporal: node.temporal,
          resources: node.resources,
        },
      })),
      edges: graph.edges.map((edge) => ({
        id: `${edge.fromNodeId}->${edge.toNodeId}`,
        source: edge.fromNodeId,
        target: edge.toNodeId,
        type: edge.dependencyType,
        temporal: edge.temporal,
        constraint: edge.resourceConstraint,
      })),
    };

    return {
      visualizationData,
      bottlenecks,
      prioritizedEdges,
    };
  }
}