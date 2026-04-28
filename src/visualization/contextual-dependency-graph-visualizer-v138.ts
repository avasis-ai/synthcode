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
  cpu_percent: number;
  memory_mb: number;
}

export interface TemporalConstraint {
  start_time_ms: number;
  end_time_ms: number;
  duration_ms: number;
}

export interface GraphNode {
  id: string;
  label: string;
  metadata: Record<string, unknown>;
  temporal?: TemporalConstraint;
  resource_usage?: ResourceUsage;
}

export interface GraphEdge {
  from: string;
  to: string;
  metadata: Record<string, unknown>;
  temporal?: TemporalConstraint;
  resource_usage?: ResourceUsage;
}

export interface ContextualGraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class ContextualDependencyGraphVisualizer {
  constructor() {}

  visualize(payload: ContextualGraphPayload): void {
    console.log("--- Contextual Dependency Graph Visualization Initialized ---");
    this.renderNodes(payload.nodes);
    this.renderEdges(payload.edges);
    console.log("--- Visualization Complete ---");
  }

  private renderNodes(nodes: GraphNode[]): void {
    console.log("\n[Nodes]");
    nodes.forEach(node => {
      console.log(`  Node ID: ${node.id} (${node.label})`);
      if (node.temporal) {
        console.log(`    [Temporal]: ${node.temporal.start_time_ms}ms to ${node.temporal.end_time_ms}ms`);
      }
      if (node.resource_usage) {
        console.log(`    [Resource]: CPU ${node.resource_usage.cpu_percent.toFixed(1)}%, Mem ${node.resource_usage.memory_mb.toFixed(0)}MB`);
      }
    });
  }

  private renderEdges(edges: GraphEdge[]): void {
    console.log("\n[Edges]");
    edges.forEach(edge => {
      console.log(`  Edge: ${edge.from} -> ${edge.to}`);
      if (edge.temporal) {
        console.log(`    [Temporal]: Duration ${edge.temporal.duration_ms}ms`);
      }
      if (edge.resource_usage) {
        console.log(`    [Resource]: Avg CPU ${edge.resource_usage.cpu_percent.toFixed(1)}%`);
      }
    });
  }

  static visualizeContextualGraph(payload: ContextualGraphPayload): void {
    const visualizer = new ContextualDependencyGraphVisualizer();
    visualizer.visualize(payload);
  }
}