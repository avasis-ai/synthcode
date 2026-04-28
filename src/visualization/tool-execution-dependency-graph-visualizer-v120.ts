import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ResourceUsage {
  cpu_cores: number;
  memory_gb: number;
  duration_ms: number;
}

export interface TemporalConstraint {
  start_time_ms: number;
  end_time_ms: number;
}

export interface ToolNodeData {
  tool_name: string;
  inputs: Record<string, unknown>;
  metadata: {
    resource_usage?: ResourceUsage;
    temporal_constraint?: TemporalConstraint;
  };
}

export interface DependencyEdgeData {
  source_tool: string;
  target_tool: string;
  dependency_type: "sequential" | "parallel" | "conditional";
  dependency_details: {
    reason: string;
    required_output_key?: string;
  };
}

export interface EnrichedGraphPayload {
  nodes: ToolNodeData[];
  edges: DependencyEdgeData[];
}

export class ToolExecutionDependencyGraphVisualizer {
  private graphData: EnrichedGraphPayload | null = null;

  constructor() {}

  public processGraphPayload(payload: EnrichedGraphPayload): void {
    this.graphData = payload;
  }

  public renderGraph(): void {
    if (!this.graphData) {
      console.error("Graph data has not been processed. Call processGraphPayload first.");
      return;
    }

    const { nodes, edges } = this.graphData;

    console.log("--- Rendering Tool Execution Dependency Graph (v120) ---");
    console.log(`Nodes detected: ${nodes.length}`);
    console.log(`Edges detected: ${edges.length}`);

    nodes.forEach((node, index) => {
      console.log(`\n[Node ${index + 1}: ${node.tool_name}]`);
      console.log(`  Inputs: ${JSON.stringify(node.inputs)}`);
      if (node.metadata.resource_usage) {
        console.log(`  Resource Usage: CPU=${node.metadata.resource_usage.cpu_cores}, Mem=${node.metadata.resource_usage.memory_gb}GB, Time=${node.metadata.resource_usage.duration_ms}ms`);
      }
      if (node.metadata.temporal_constraint) {
        console.log(`  Temporal Constraint: Start=${node.metadata.temporal_constraint.start_time_ms}ms, End=${node.metadata.temporal_constraint.end_time_ms}ms`);
      }
    });

    edges.forEach((edge, index) => {
      console.log(`\n[Edge ${index + 1}: ${edge.source_tool} -> ${edge.target_tool}]`);
      console.log(`  Type: ${edge.dependency_type}`);
      console.log(`  Details: ${edge.dependency_details.reason}`);
    });

    console.log("--- Rendering Complete ---");
  }

  public getGraphData(): EnrichedGraphPayload | null {
    return this.graphData;
  }
}