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

interface ResourceUsage {
  cpu_cores: number;
  memory_gb: number;
  network_throughput_mbps: number;
}

interface TimeWindow {
  start_time_ms: number;
  end_time_ms: number;
}

interface DependencyEdge {
  sourceId: string;
  targetId: string;
  duration_ms: number;
  resource_profile: ResourceUsage;
  temporal_constraint: {
    min_delay_ms: number;
    max_delay_ms: number;
  };
}

interface NodePayload {
  id: string;
  type: "tool_execution" | "user_input" | "assistant_response";
  name: string;
  time_window: TimeWindow;
  resource_usage: ResourceUsage;
  metadata: Record<string, unknown>;
}

interface EnrichedDependencyGraphPayload {
  nodes: NodePayload[];
  edges: DependencyEdge[];
}

export class ToolExecutionDependencyGraphVisualizer {
  private readonly graphPayload: EnrichedDependencyGraphPayload;

  constructor(graphPayload: EnrichedDependencyGraphPayload) {
    this.graphPayload = graphPayload;
  }

  private processNode(node: NodePayload): string {
    return `Node ${node.id}: ${node.name} [${node.type}] (${node.time_window.start_time_ms}-${node.time_window.end_time_ms}ms)`;
  }

  private processEdge(edge: DependencyEdge): string {
    const constraint = edge.temporal_constraint;
    return `Edge ${edge.sourceId} -> ${edge.targetId}: Duration=${edge.duration_ms}ms, Resources=${edge.resource_profile.cpu_cores} cores, Constraint=[${constraint.min_delay_ms}-${constraint.max_delay_ms}ms]`;
  }

  public visualizeGraph(): string {
    let output = "--- Tool Execution Dependency Graph Visualization ---\n";

    output += "\n[Nodes]\n";
    this.graphPayload.nodes.forEach(node => {
      output += this.processNode(node) + "\n";
    });

    output += "\n[Edges]\n";
    this.graphPayload.edges.forEach(edge => {
      output += this.processEdge(edge) + "\n";
    });

    output += "\n--- Visualization Complete ---\n";
    return output;
  }

  public renderTemporalFlow(
    payload: EnrichedDependencyGraphPayload
  ): string {
    const enrichedPayload = payload;

    let output = "======================================================\n";
    output += "TEMPORAL AND RESOURCE FLOW VISUALIZATION REPORT\n";
    output += "======================================================\n";

    output += "\n[Temporal Node Breakdown]\n";
    enrichedPayload.nodes.forEach(node => {
      output += `  ${this.processNode(node)}\n`;
    });

    output += "\n[Resource Constrained Edges]\n";
    enrichedPayload.edges.forEach(edge => {
      output += `  ${this.processEdge(edge)}\n`;
    });

    output += "\nVisualization successfully mapped temporal windows and resource constraints.\n";
    return output;
  }
}