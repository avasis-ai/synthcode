import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface TemporalNode {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  resourceUsage: {
  cpu: number;
  memory: number;
}
}

export interface TemporalEdge {
  sourceId: string;
  targetId: string;
  startTime: number;
  endTime: number;
  dataTransferSize: number;
}

export interface DependencyGraphData {
  nodes: TemporalNode[];
  edges: TemporalEdge[];
}

export class ToolExecutionDependencyGraphVisualizerV31 {
  private graphData: DependencyGraphData;

  constructor(graphData: DependencyGraphData) {
    this.graphData = graphData;
  }

  public visualize(): string {
    const nodeVisuals = this.renderNodes();
    const edgeVisuals = this.renderEdges();
    return `Visualization rendered successfully. Nodes: ${nodeVisuals}, Edges: ${edgeVisuals}`;
  }

  private renderNodes(): string {
    const nodeDetails = this.graphData.nodes.map(node => {
      const duration = node.endTime - node.startTime;
      return `Node ${node.id}: Label="${node.label}", Duration=${duration}ms, Resources={CPU:${node.resourceUsage.cpu}, MEM:${node.resourceUsage.memory}}`;
    }).join(" | ");
    return `[Nodes: ${nodeDetails}]`;
  }

  private renderEdges(): string {
    const edgeDetails = this.graphData.edges.map(edge => {
      const duration = edge.endTime - edge.startTime;
      return `Edge ${edge.sourceId} -> ${edge.targetId}: Duration=${duration}ms, Transfer=${edge.dataTransferSize} bytes`;
    }).join(" | ");
    return `[Edges: ${edgeDetails}]`;
  }
}