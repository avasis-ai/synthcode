import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface TemporalEdgeData {
  sourceNodeId: string;
  targetNodeId: string;
  startTime?: number;
  endTime?: number;
  resourceRequired: string;
  constraintType: "exclusive" | "sequential" | "overlap";
}

export interface DependencyGraphData {
  nodes: Record<string, { id: string; label: string; metadata: Record<string, unknown> }>;
  standardEdges: { source: string; target: string; weight: number }[];
  temporalEdges: TemporalEdgeData[];
}

export class DependencyGraphVisualizerV19 {
  private graphData: DependencyGraphData;

  constructor(graphData: DependencyGraphData) {
    this.graphData = graphData;
  }

  private renderNode(nodeId: string): string {
    const node = this.graphData.nodes[nodeId];
    if (!node) return "";
    return `[Node: ${node.label} (${nodeId})]`;
  }

  private renderStandardEdge(edge: { source: string; target: string; weight: number }): string {
    return `--> ${edge.source} --(${edge.weight.toFixed(1)})--> ${edge.target}`;
  }

  private renderTemporalEdge(edge: TemporalEdgeData): string {
    let output = `[Temporal Constraint: ${edge.sourceNodeId} -> ${edge.targetNodeId}]`;
    if (edge.startTime !== undefined && edge.endTime !== undefined) {
      output += ` | Time: ${edge.startTime} to ${edge.endTime}`;
    }
    output += ` | Resource: ${edge.resourceRequired} (${edge.constraintType})`;
    return output;
  }

  public visualize(): string {
    let output = "--- Dependency Graph Visualization V19 ---\n";

    output += "\n--- 1. Standard Tool Dependencies ---\n";
    this.graphData.standardEdges.forEach(edge => {
      output += this.renderStandardEdge(edge) + "\n";
    });

    output += "\n--- 2. Temporal & Resource Constraints ---\n";
    if (this.graphData.temporalEdges.length === 0) {
      output += "No specialized temporal or resource constraints found.\n";
    } else {
      this.graphData.temporalEdges.forEach(edge => {
        output += this.renderTemporalEdge(edge) + "\n";
      });
    }

    output += "\n--- 3. Nodes Overview ---\n";
    Object.values(this.graphData.nodes).forEach(node => {
      output += this.renderNode(node.id) + "\n";
    });

    output += "\n--- Visualization Complete (V19) ---";
    return output;
  }
}

export function createDependencyGraphVisualizerV19(graphData: DependencyGraphData): DependencyGraphVisualizerV19 {
  return new DependencyGraphVisualizerV19(graphData);
}