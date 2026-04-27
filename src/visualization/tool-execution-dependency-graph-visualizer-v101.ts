import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type TemporalMetadata = {
  startTime: number;
  endTime: number;
  durationMs: number;
};

export type ResourceUsage = {
  cpuUsagePercent: number;
  memoryUsageBytes: number;
  networkBytesTransferred: number;
};

export interface GraphNode {
  id: string;
  type: "tool_call" | "agent_step" | "user_input";
  label: string;
  temporalMetadata: TemporalMetadata;
  resourceUsage: ResourceUsage;
  metadata: Record<string, unknown>;
}

export enum DependencyType {
  DATA = "DATA",
  CONTROL = "CONTROL",
  TEMPORAL = "TEMPORAL",
}

export interface GraphEdge {
  fromNodeId: string;
  toNodeId: string;
  dependencyType: DependencyType;
  dataFlow?: {
    dataId: string;
    sourceNodeId: string;
  };
}

export interface ExecutionGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  rootNodeId: string;
}

export class ToolExecutionDependencyGraphVisualizerV101 {
  private graphData: ExecutionGraphData;

  constructor(graphData: ExecutionGraphData) {
    this.graphData = graphData;
  }

  public visualize(): void {
    console.log("--- ToolExecutionDependencyGraphVisualizerV101 Initializing ---");
    this.validateGraphData();
    this.renderGraphStructure();
    this.overlayMetadata();
    console.log("--- Visualization Complete: Single Pane of Glass View Rendered ---");
  }

  private validateGraphData(): void {
    if (!this.graphData.nodes || this.graphData.nodes.length === 0) {
      throw new Error("Graph data must contain at least one node.");
    }
    if (!this.graphData.edges || this.graphData.edges.length === 0) {
      console.warn("Warning: Graph data contains no edges.");
    }
    const nodeIds = new Set(this.graphData.nodes.map(n => n.id));
    for (const edge of this.graphData.edges) {
      if (!nodeIds.has(edge.fromNodeId) || !nodeIds.has(edge.toNodeId)) {
        throw new Error(`Edge references unknown node ID: ${edge.fromNodeId} -> ${edge.toNodeId}`);
      }
    }
  }

  private renderGraphStructure(): void {
    console.log("\n[Structure Rendering] Drawing Nodes and Edges...");
    const nodeMap = new Map<string, GraphNode>();
    this.graphData.nodes.forEach(node => nodeMap.set(node.id, node));

    console.log(`  -> Found ${nodeMap.size} Nodes.`);

    this.graphData.edges.forEach(edge => {
      const fromNode = nodeMap.get(edge.fromNodeId);
      const toNode = nodeMap.get(edge.toNodeId);

      if (fromNode && toNode) {
        let edgeType = this.getDependencyTypeLabel(edge.dependencyType);
        console.log(`  -> Drawing Edge: ${fromNode.id} --(${edgeType})--> ${toNode.id}`);
      }
    });
  }

  private getDependencyTypeLabel(type: DependencyType): string {
    switch (type) {
      case DependencyType.DATA:
        return "DATA_FLOW";
      case DependencyType.CONTROL:
        return "CONTROL_FLOW";
      case DependencyType.TEMPORAL:
        return "TEMPORAL_LINK";
      default:
        return "UNKNOWN";
    }
  }

  private overlayMetadata(): void {
    console.log("\n[Metadata Overlay] Applying Rich Overlays...");

    // Node Metadata Visualization
    this.graphData.nodes.forEach(node => {
      console.log(`  - Node ${node.id} (${node.type}):`);
      console.log(`    [Time]: ${node.temporalMetadata.durationMs.toFixed(2)}ms | [Resources]: CPU=${node.resourceUsage.cpuUsagePercent.toFixed(1)}%`);
    });

    // Edge Metadata Visualization
    this.graphData.edges.forEach(edge => {
      let metadata = `Type: ${this.getDependencyTypeLabel(edge.dependencyType)}`;
      if (edge.dataFlow) {
        metadata += ` | Data ID: ${edge.dataFlow.dataId}`;
      }
      console.log(`  - Edge ${edge.fromNodeId} -> ${edge.toNodeId}: ${metadata}`);
    });
  }
}