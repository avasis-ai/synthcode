import {
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
  label: string;
  dependencies: string[];
  startTime?: number;
  endTime?: number;
  resourceRequirements?: Record<string, number>;
}

export interface DependencyEdge {
  from: string;
  to: string;
  weight: number;
  temporal?: {
    startTime: number;
    endTime: number;
  };
  constraints?: {
    resource: string;
    minCapacity: number;
  };
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: DependencyEdge[];
}

export class DependencyGraphVisualizerV10 {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private processTemporalEdges(edges: DependencyEdge[]): any[] {
    return edges.filter(edge => edge.temporal)
      .map(edge => ({
        type: "temporaledge",
        from: edge.from,
        to: edge.to,
        duration: edge.temporal.endTime - edge.temporal.startTime,
        startTime: edge.temporal.startTime,
        endTime: edge.temporal.endTime,
      }));
  }

  private processResourceConstraints(edges: DependencyEdge[]): any[] {
    return edges.filter(edge => edge.constraints)
      .map(edge => ({
        type: "resourceconstraint",
        from: edge.from,
        to: edge.to,
        resource: edge.constraints.resource,
        minCapacity: edge.constraints.minCapacity,
      }));
  }

  private renderStandardDependencies(graph: DependencyGraph): any[] {
    return graph.edges.map(edge => ({
      type: "standardedge",
      from: edge.from,
      to: edge.to,
      weight: edge.weight,
    }));
  }

  private renderNodes(graph: DependencyGraph): any[] {
    return graph.nodes.map(node => ({
      type: "node",
      id: node.id,
      label: node.label,
      startTime: node.startTime,
      endTime: node.endTime,
      resources: node.resourceRequirements,
    }));
  }

  public visualize(temporal: boolean = false): { nodes: any[]; edges: any[] } {
    const nodes = this.renderNodes(this.graph);
    let edges: any[];

    if (temporal) {
      const temporalEdges = this.processTemporalEdges(this.graph.edges);
      const resourceMarkers = this.processResourceConstraints(this.graph.edges);
      const standardEdges = this.renderStandardDependencies(this.graph);
      edges = [...temporalEdges, ...resourceMarkers, ...standardEdges];
    } else {
      edges = this.renderStandardDependencies(this.graph);
    }

    return { nodes, edges };
  }
}