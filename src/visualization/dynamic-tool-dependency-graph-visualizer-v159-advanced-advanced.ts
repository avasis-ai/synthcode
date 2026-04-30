import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface AdvancedDependencyMetadata {
  sourceToolId: string;
  targetToolId: string;
  dependencyType: "direct" | "inferred" | "potential" | "temporal";
  confidenceScore: number;
  inferredPath?: string[];
  temporalConstraint?: {
    startStep: number;
    endStep: number;
  };
}

export interface ToolNode {
  id: string;
  name: string;
  capabilities: string[];
  metadata: Record<string, unknown>;
}

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  metadata: AdvancedDependencyMetadata;
}

export interface DependencyGraph {
  nodes: ToolNode[];
  edges: DependencyEdge[];
}

export interface AdvancedGraphConfig {
  showInferredDependencies: boolean;
  showPotentialDependencies: boolean;
  minConfidenceScore: number;
  maxDepth: number;
}

export class DynamicToolDependencyGraphVisualizer {
  private graph: DependencyGraph;
  private config: AdvancedGraphConfig;

  constructor(graph: DependencyGraph, config: AdvancedGraphConfig = {
    showInferredDependencies: true,
    showPotentialDependencies: true,
    minConfidenceScore: 0.5,
    maxDepth: 3,
  }) {
    this.graph = graph;
    this.config = config;
  }

  public updateConfig(newConfig: Partial<AdvancedGraphConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
  }

  public visualize(renderer: (graph: DependencyGraph, config: AdvancedGraphConfig) => void): void {
    renderer(this.graph, this.config);
  }

  private filterEdges(edge: DependencyEdge): boolean {
    const meta = edge.metadata;
    if (meta.confidenceScore < this.config.minConfidenceScore) {
      return false;
    }

    if (meta.dependencyType === "inferred" && !this.config.showInferredDependencies) {
      return false;
    }

    if (meta.dependencyType === "potential" && !this.config.showPotentialDependencies) {
      return false;
    }

    return true;
  }

  public getFilteredGraph(): {
    nodes: ToolNode[];
    edges: DependencyEdge[];
  } {
    const filteredEdges = this.graph.edges.filter(this.filterEdges);
    return {
      nodes: this.graph.nodes,
      edges: filteredEdges,
    };
  }
}