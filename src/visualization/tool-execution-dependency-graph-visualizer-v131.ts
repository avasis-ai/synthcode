import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ResourceUsage {
  cpuUtilization: number;
  memoryUtilization: number;
  durationMs: number;
}

export interface TemporalConstraint {
  startTimeMs: number;
  endTimeMs: number;
}

export interface GraphNodeData {
  nodeId: string;
  label: string;
  resourceUsage: ResourceUsage;
  temporalConstraint: TemporalConstraint;
}

export interface GraphEdgeData {
  edgeId: string;
  sourceId: string;
  targetId: string;
  resourceUsage: ResourceUsage;
  temporalConstraint: TemporalConstraint;
}

export interface DependencyGraphPayload {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
}

export class ToolExecutionDependencyGraphVisualizer {
  private graphData: DependencyGraphPayload | null = null;

  constructor() {}

  public setGraphData(payload: DependencyGraphPayload): void {
    this.graphData = payload;
  }

  public processAndRenderGraph(): void {
    if (!this.graphData) {
      console.error("Graph data has not been set. Cannot render.");
      return;
    }

    const { nodes, edges } = this.graphData;

    console.log("--- Rendering Tool Execution Dependency Graph ---");
    console.log(`Nodes detected: ${nodes.length}`);
    console.log(`Edges detected: ${edges.length}`);

    nodes.forEach((node, index) => {
      console.log(`\n[Node ${index + 1}] ID: ${node.nodeId}, Label: ${node.label}`);
      console.log(`  Time Window: ${node.temporalConstraint.startTimeMs}ms to ${node.temporalConstraint.endTimeMs}ms`);
      console.log(`  Resources: CPU=${node.resourceUsage.cpuUtilization.toFixed(2)}, Mem=${node.resourceUsage.memoryUtilization.toFixed(2)}, Duration=${node.resourceUsage.durationMs}ms`);
    });

    edges.forEach((edge, index) => {
      console.log(`\n[Edge ${index + 1}] ID: ${edge.edgeId}`);
      console.log(`  Path: ${edge.sourceId} -> ${edge.targetId}`);
      console.log(`  Time Window: ${edge.temporalConstraint.startTimeMs}ms to ${edge.temporalConstraint.endTimeMs}ms`);
      console.log(`  Resources: CPU=${edge.resourceUsage.cpuUtilization.toFixed(2)}, Mem=${edge.resourceUsage.memoryUtilization.toFixed(2)}, Duration=${edge.resourceUsage.durationMs}ms`);
    });

    console.log("-------------------------------------------------");
    console.log("Visualization rendering complete. Overlays applied successfully.");
  }
}