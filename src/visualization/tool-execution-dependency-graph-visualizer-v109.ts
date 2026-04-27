import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface TemporalMetadata {
  startTime: number;
  endTime: number;
  resourceUsage: Record<string, number>;
}

export interface GraphNodeWithTime extends GraphNode {
  temporalData: TemporalMetadata;
}

export interface GraphEdgeWithTime extends GraphEdge {
  temporalData: {
    startTime: number;
    endTime: number;
    resourceUsage: Record<string, number>;
  };
}

export interface EnrichedDependencyGraph {
  nodes: GraphNodeWithTime[];
  edges: GraphEdgeWithTime[];
}

interface GraphNode {
  id: string;
  name: string;
  dependencies: string[];
}

interface GraphEdge {
  source: string;
  target: string;
}

export class ToolExecutionDependencyGraphVisualizerV109 {
  private graph: EnrichedDependencyGraph;

  constructor(graph: EnrichedDependencyGraph) {
    this.graph = graph;
  }

  public visualize(): string {
    const nodeVisualizations = this.graph.nodes.map(node =>
      this.renderNode(node)
    ).join("\n");

    const edgeVisualizations = this.graph.edges.map(edge =>
      this.renderEdge(edge)
    ).join("\n");

    return `--- Tool Execution Dependency Graph (V109) ---\n\nNodes:\n${nodeVisualizations}\n\nEdges:\n${edgeVisualizations}\n\n--- Visualization Complete ---`;
  }

  private renderNode(node: GraphNodeWithTime): string {
    const { id, name, dependencies, temporalData } = node;
    const duration = temporalData.endTime - temporalData.startTime;
    const resourceInfo = Object.entries(temporalData.resourceUsage)
      .map(([resource, usage]) => `${resource}: ${usage} units`)
      .join(", ");

    return `Node [${id}] (${name}):\n  Duration: ${duration.toFixed(2)} units\n  Resources Used: ${resourceInfo}\n  Depends On: ${dependencies.join(", ")}`;
  }

  private renderEdge(edge: GraphEdgeWithTime): string {
    const { source, target, temporalData } = edge;
    const duration = temporalData.endTime - temporalData.startTime;
    const resourceInfo = Object.entries(temporalData.resourceUsage)
      .map(([resource, usage]) => `${resource}: ${usage} units`)
      .join(", ");

    return `Edge [${source} -> ${target}]:\n  Duration: ${duration.toFixed(2)} units\n  Resources Used: ${resourceInfo}`;
  }
}