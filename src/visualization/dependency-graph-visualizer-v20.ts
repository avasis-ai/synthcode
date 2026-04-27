import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface TemporalDependencyEdge {
  sourceId: string;
  targetId: string;
  startTimeMs: number;
  endTimeMs: number;
  resourceUsage: Record<string, {
    min: number;
    max: number;
  }>;
}

export interface NodeData {
  id: string;
  label: string;
  type: "agent" | "tool";
  metadata: Record<string, any>;
}

export class ToolExecutionDependencyGraphVisualizerV20 {
  private nodes: NodeData[];
  private edges: TemporalDependencyEdge[];

  constructor(nodes: NodeData[], edges: TemporalDependencyEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  public visualize(): void {
    console.log("--- Dependency Graph Visualization V2.0 Initiated ---");
    this.renderNodes();
    this.renderEdges();
    this.overlayTemporalAndResourceData();
    console.log("--- Visualization Complete ---");
  }

  private renderNodes(): void {
    console.log(`Rendering ${this.nodes.length} nodes.`);
    this.nodes.forEach(node => {
      console.log(`  Node [${node.id}]: ${node.label} (${node.type})`);
    });
  }

  private renderEdges(): void {
    console.log(`Rendering ${this.edges.length} temporal edges.`);
    this.edges.forEach(edge => {
      console.log(
        `  Edge: ${edge.sourceId} -> ${edge.targetId} | Time: ${edge.startTimeMs}ms to ${edge.endTimeMs}ms`
      );
    });
  }

  private overlayTemporalAndResourceData(): void {
    console.log("Applying temporal and resource overlays...");
    if (this.edges.length === 0) {
      console.warn("No edges provided to overlay temporal data.");
      return;
    }

    const minTime = Math.min(...this.edges.map(e => e.startTimeMs));
    const maxTime = Math.max(...this.edges.map(e => e.endTimeMs));

    console.log(`  Overall Time Span: ${minTime}ms to ${maxTime}ms`);

    this.edges.forEach(edge => {
      console.log(
        `  [Overlay] ${edge.sourceId} -> ${edge.targetId}: Time Window [${edge.startTimeMs}, ${edge.endTimeMs}]. Resources:`,
        edge.resourceUsage
      );
    });
  }
}