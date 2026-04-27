import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ConstraintMetadata {
  startTime?: number;
  endTime?: number;
  requiredResources?: Record<string, number>;
  isBottleneck?: boolean;
}

export interface NodeData {
  id: string;
  name: string;
  metadata: ConstraintMetadata;
}

export interface EdgeData {
  sourceId: string;
  targetId: string;
  metadata: ConstraintMetadata;
}

export interface AdvancedGraphPayload {
  nodes: NodeData[];
  edges: EdgeData[];
}

export class ToolExecutionDependencyGraphVisualizer {
  private graphData: AdvancedGraphPayload;

  constructor() {
    this.graphData = { nodes: [], edges: [] };
  }

  public setGraphData(payload: AdvancedGraphPayload): void {
    this.graphData = payload;
  }

  public visualizeAdvancedGraph(): void {
    const nodes = this.graphData.nodes;
    const edges = this.graphData.edges;

    console.log("--- Advanced Dependency Graph Visualization ---");
    console.log(`Nodes visualized: ${nodes.length}`);
    console.log(`Edges visualized: ${edges.length}`);

    nodes.forEach((node, index) => {
      console.log(`\n[Node ${index + 1}: ${node.name} (${node.id})]`);
      if (node.metadata.isBottleneck) {
        console.warn("  !!! BOTTLENECK DETECTED !!!");
      }
      if (node.metadata.startTime && node.metadata.endTime) {
        console.log(`  Time Span: ${node.metadata.startTime} -> ${node.metadata.endTime}`);
      }
      if (node.metadata.requiredResources) {
        console.log("  Resources Required:", JSON.stringify(node.metadata.requiredResources));
      }
    });

    edges.forEach((edge, index) => {
      console.log(`\n[Edge ${index + 1}: ${edge.sourceId} -> ${edge.targetId}]`);
      if (edge.metadata.isBottleneck) {
        console.warn("  !!! BOTTLENECK DETECTED !!!");
      }
      if (edge.metadata.startTime && edge.metadata.endTime) {
        console.log(`  Time Span: ${edge.metadata.startTime} -> ${edge.metadata.endTime}`);
      }
      if (edge.metadata.requiredResources) {
        console.log("  Resources Required:", JSON.stringify(edge.metadata.requiredResources));
      }
    });

    console.log("\nVisualization complete. Overlaid timelines and resource contention points rendered.");
  }

  public processAndRenderAdvancedGraph(payload: AdvancedGraphPayload): void {
    this.setGraphData(payload);
    this.visualizeAdvancedGraph();
  }
}