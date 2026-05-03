import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface ResourceConstraint {
  resourceName: string;
  requiredByToolId: string;
  startTime: number;
  endTime: number;
}

interface DependencyEdge {
  sourceToolId: string;
  targetToolId: string;
  dependencyType: "data_flow" | "temporal" | "resource";
  dataFlow?: {
    sourceField: string;
    targetField: string;
  };
  resourceConflict?: ResourceConstraint;
}

interface ToolExecutionTrace {
  toolId: string;
  startTime: number;
  endTime: number;
  resourcesUsed: ResourceConstraint[];
  dependencies: DependencyEdge[];
}

type GraphNode = {
  toolId: string;
  name: string;
  startTime: number;
  endTime: number;
};

type GraphEdge = {
  sourceId: string;
  targetId: string;
  dependency: DependencyEdge;
};

export class ToolExecutionDependencyGraphVisualizerAdvancedV1 {
  private trace: ToolExecutionTrace[];
  private nodes: GraphNode[];
  private edges: GraphEdge[];

  constructor(trace: ToolExecutionTrace[]) {
    this.trace = trace;
    this.nodes = [];
    this.edges = [];
  }

  private buildNodes(): void {
    this.nodes = this.trace.map(traceItem => ({
      toolId: traceItem.toolId,
      name: `Tool ${traceItem.toolId}`,
      startTime: traceItem.startTime,
      endTime: traceItem.endTime,
    }));
  }

  private buildEdges(): void {
    this.edges = [];
    for (const traceItem of this.trace) {
      for (const dependency of traceItem.dependencies) {
        const edge: GraphEdge = {
          sourceId: traceItem.toolId,
          targetId: dependency.targetToolId || "unknown",
          dependency: dependency,
        };
        this.edges.push(edge);
      }
    }
  }

  private calculateConflictSeverity(edge: DependencyEdge): number {
    if (!edge.resourceConflict) {
      return 0;
    }
    // Simple severity: overlap duration * number of conflicting resources
    const overlap = Math.max(0, Math.min(edge.resourceConflict.endTime, 100) - Math.max(edge.resourceConflict.startTime, 0));
    return overlap * 1;
  }

  public visualize(): { nodes: GraphNode[]; edges: GraphEdge[]; } {
    this.buildNodes();
    this.buildEdges();

    // Post-process edges to enrich visualization data (e.g., calculate severity)
    const enrichedEdges: GraphEdge[] = this.edges.map(edge => {
      const severity = this.calculateConflictSeverity(edge.dependency);
      return {
        ...edge,
        // In a real implementation, this would pass severity to the renderer
        severity: severity,
      } as GraphEdge & { severity: number };
    });

    return {
      nodes: this.nodes,
      edges: enrichedEdges,
    };
  }
}