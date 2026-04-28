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
  cpu_percent: number;
  memory_mb: number;
  network_throughput_mbps: number;
}

export interface TemporalConstraint {
  start_time_ms: number;
  end_time_ms: number;
  duration_ms: number;
}

export interface GraphNodeMetadata {
  nodeId: string;
  resourceUsage: ResourceUsage;
  temporalConstraint: TemporalConstraint;
}

export interface GraphEdgeMetadata {
  edgeId: string;
  resourceUsage: ResourceUsage;
  temporalConstraint: TemporalConstraint;
}

export interface EnrichedGraphData {
  nodes: Record<string, {
    data: any;
    metadata: GraphNodeMetadata;
  }>;
  edges: Record<string, {
    data: any;
    metadata: GraphEdgeMetadata;
  }>;
}

export class ToolExecutionDependencyGraphVisualizerV110 {
  private readonly graphData: EnrichedGraphData;

  constructor(graphData: EnrichedGraphData) {
    this.graphData = graphData;
  }

  private calculateNodeVisualProperties(metadata: GraphNodeMetadata): {
    color: string;
    size: number;
    labelSuffix: string;
  } {
    const cpuRatio = metadata.resourceUsage.cpu_percent / 100;
    const memRatio = metadata.resourceUsage.memory_mb / 4096; // Assuming 4GB max for scaling
    const maxRatio = Math.max(cpuRatio, memRatio);

    let color: string;
    if (maxRatio > 0.8) {
      color = "red";
    } else if (maxRatio > 0.5) {
      color = "orange";
    } else {
      color = "green";
    }

    const size = 10 + Math.sqrt(maxRatio) * 20;
    const labelSuffix = `[Time: ${Math.round(metadata.temporalConstraint.duration_ms / 1000)}s, R: ${Math.round(maxRatio * 100)}%]`;

    return { color, size, labelSuffix };
  }

  private calculateEdgeVisualProperties(metadata: GraphEdgeMetadata): {
    thickness: number;
    style: string;
  } {
    const throughputRatio = metadata.resourceUsage.network_throughput_mbps / 100; // Assuming 100 Mbps max
    const thickness = 1 + Math.min(1, throughputRatio) * 3;

    let style: string;
    if (metadata.temporalConstraint.duration_ms > 5000) {
      style = "dashed";
    } else {
      style = "solid";
    }

    return { thickness, style };
  }

  public renderVisualization(): {
    nodeStyles: Record<string, { color: string; size: number; labelSuffix: string }>;
    edgeStyles: Record<string, { thickness: number; style: string }>;
    visualizationOutput: string;
  } {
    const nodeStyles: Record<string, { color: string; size: number; labelSuffix: string }> = {};
    for (const nodeId in this.graphData.nodes) {
      const metadata = this.graphData.nodes[nodeId].metadata;
      nodeStyles[nodeId] = this.calculateNodeVisualProperties(metadata);
    }

    const edgeStyles: Record<string, { thickness: number; style: string }> = {};
    for (const edgeId in this.graphData.edges) {
      const metadata = this.graphData.edges[edgeId].metadata;
      edgeStyles[edgeId] = this.calculateEdgeVisualProperties(metadata);
    }

    const output = `Visualization rendered successfully. Nodes analyzed: ${Object.keys(this.graphData.nodes).length}. Edges analyzed: ${Object.keys(this.graphData.edges).length}.`;

    return {
      nodeStyles,
      edgeStyles,
      visualizationOutput: output,
    };
  }
}