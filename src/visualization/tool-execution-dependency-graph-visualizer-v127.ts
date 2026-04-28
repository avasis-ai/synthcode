import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ResourceUsage {
  cpu_cores: number;
  memory_gb: number;
  network_throughput_mbps: number;
}

export interface TemporalMetadata {
  start_time_ms: number;
  end_time_ms: number;
  duration_ms: number;
}

export interface NodeData {
  id: string;
  type: "message" | "tool_call" | "tool_result";
  content: any;
  metadata: TemporalMetadata;
  resource_usage: ResourceUsage;
}

export interface EdgeData {
  sourceId: string;
  targetId: string;
  type: "causal" | "temporal" | "resource_constraint";
  metadata: TemporalMetadata;
  dependency_strength: number;
}

export interface GraphPayload {
  nodes: NodeData[];
  edges: EdgeData[];
}

export class ToolExecutionDependencyGraphVisualizer {
  private payload: GraphPayload;

  constructor(payload: GraphPayload) {
    this.payload = payload;
  }

  private validatePayload(): boolean {
    if (!this.payload || !this.payload.nodes || !this.payload.edges) {
      return false;
    }
    return true;
  }

  public renderVisualization(): void {
    if (!this.validatePayload()) {
      console.error("Invalid GraphPayload provided for visualization.");
      return;
    }

    console.log("--- Rendering Tool Execution Dependency Graph ---");
    console.log(`Nodes detected: ${this.payload.nodes.length}`);
    console.log(`Edges detected: ${this.payload.edges.length}`);

    this.renderGraphStructure();
    this.renderTemporalOverlaps();
    this.renderResourceBottlenecks();
  }

  private renderGraphStructure(): void {
    console.log("\n[Structure Rendering] Mapping Nodes and Edges...");
    const nodeMap = new Map<string, NodeData>();
    this.payload.nodes.forEach(node => nodeMap.set(node.id, node));

    this.payload.edges.forEach(edge => {
      const source = nodeMap.get(edge.sourceId);
      const target = nodeMap.get(edge.targetId);

      if (source && target) {
        console.log(
          `  Edge: ${source.id} -> ${target.id} | Type: ${edge.type} | Strength: ${edge.dependency_strength.toFixed(2)}`
        );
      } else {
        console.warn(`  Warning: Edge references unknown node IDs: ${edge.sourceId} or ${edge.targetId}`);
      }
    });
  }

  private renderTemporalOverlaps(): void {
    console.log("\n[Temporal Rendering] Analyzing Time-Aware Dependencies (Gantt Overlay Simulation)...");
    const timeConflicts = this.payload.edges.filter(
      (edge) =>
        Math.max(
          this.payload.nodes.find(n => n.id === edge.sourceId)?.metadata.start_time_ms || 0,
          this.payload.nodes.find(n => n.id === edge.targetId)?.metadata.start_time_ms || 0
        ) < Math.min(
          this.payload.nodes.find(n => n.id === edge.sourceId)?.metadata.end_time_ms || Infinity,
          this.payload.nodes.find(n => n.id === edge.targetId)?.metadata.end_time_ms || -Infinity
        )
    );

    if (timeConflicts.length > 0) {
      console.log(`  Found ${timeConflicts.length} edges indicating potential temporal overlap or sequence constraint.`);
    } else {
      console.log("  No immediate temporal overlaps detected based on provided metadata.");
    }
  }

  private renderResourceBottlenecks(): void {
    console.log("\n[Resource Rendering] Identifying Resource Bottlenecks...");
    const resourceUsageMap = new Map<string, ResourceUsage>();
    this.payload.nodes.forEach((node) => {
      resourceUsageMap.set(node.id, node.resource_usage);
    });

    let maxCpu = 0;
    let maxMem = 0;
    let bottleneckNodeId: string | null = null;

    for (const [id, usage] of resourceUsageMap.entries()) {
      if (usage.cpu_cores > maxCpu) {
        maxCpu = usage.cpu_cores;
        bottleneckNodeId = id;
      }
      if (usage.memory_gb > maxMem) {
        maxMem = usage.memory_gb;
        bottleneckNodeId = id;
      }
    }

    console.log(`  Maximum observed CPU usage: ${maxCpu} cores.`);
    console.log(`  Maximum observed Memory usage: ${maxMem} GB.`);
    if (bottleneckNodeId) {
      console.warn(`  Potential Bottleneck Node ID: ${bottleneckNodeId} (Check resource constraints for this node).`);
    }
  }

  public getGraphPayload(): GraphPayload {
    return this.payload;
  }
}