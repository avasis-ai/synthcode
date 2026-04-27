import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface TemporalMetadata {
  startTime?: number;
  endTime?: number;
  requiredResources?: string[];
  conflict?: "temporal" | "resource" | null;
}

interface GraphNode {
  id: string;
  label: string;
  metadata: TemporalMetadata;
}

interface GraphEdge {
  sourceId: string;
  targetId: string;
  metadata: TemporalMetadata;
}

interface TemporalGraphContext {
  currentTime: number;
  globalResourceLocks: Record<string, { endTime: number }>;
}

export class ToolExecutionDependencyGraphVisualizerV15 {
  private nodes: GraphNode[];
  private edges: GraphEdge[];

  constructor(nodes: GraphNode[], edges: GraphEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private getNodeStyle(node: GraphNode): { backgroundColor: string; borderColor: string; } {
    if (node.metadata.conflict === "temporal") {
      return { backgroundColor: "#ffdddd", borderColor: "red" };
    }
    if (node.metadata.conflict === "resource") {
      return { backgroundColor: "#fff3cd", borderColor: "orange" };
    }
    return { backgroundColor: "#e6f7ff", borderColor: "#91d5ff" };
  }

  private getEdgeStyle(edge: GraphEdge): { stroke: string; strokeWidth: number } {
    if (edge.metadata.conflict === "temporal") {
      return { stroke: "red", strokeWidth: 3 };
    }
    if (edge.metadata.conflict === "resource") {
      return { stroke: "orange", strokeWidth: 3 };
    }
    return { stroke: "#3b82f6", strokeWidth: 2 };
  }

  public visualize(context: TemporalGraphContext): { nodes: { style: { backgroundColor: string; borderColor: string } }[]; edges: { style: { stroke: string; strokeWidth: number } }[] } {
    const nodeStyles = this.nodes.map(node => ({
      style: this.getNodeStyle(node),
    }));

    const edgeStyles = this.edges.map(edge => ({
      style: this.getEdgeStyle(edge),
    }));

    return { nodes: nodeStyles, edges: edgeStyles };
  }

  public visualizeWithContext(context: TemporalGraphContext): { nodes: { style: { backgroundColor: string; borderColor: string } }[]; edges: { style: { stroke: string; strokeWidth: number } }[] } {
    // In a real implementation, context would modify conflict detection,
    // but for this structure, we pass the context to the primary visualization method
    // or use it to refine the metadata before calling visualize.
    // Here, we simulate context usage by ensuring the context is available.
    console.log("Using TemporalGraphContext for enhanced visualization.");
    return this.visualize(context);
  }
}