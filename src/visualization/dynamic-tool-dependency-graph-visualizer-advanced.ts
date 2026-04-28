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

export interface ResourceProfile {
  cpuUsage: number;
  memoryUsageMB: number;
  networkBandwidthMbps: number;
}

export interface TemporalConstraint {
  startTimeMs: number;
  endTimeMs: number;
}

export interface Capability {
  name: string;
  description: string;
}

export interface GraphNodePayload {
  id: string;
  name: string;
  type: "tool" | "user" | "system";
  resourceProfile?: ResourceProfile;
  temporalConstraint?: TemporalConstraint;
  capabilities?: Capability[];
}

export interface GraphEdgePayload {
  sourceId: string;
  targetId: string;
  dependencyType: "calls" | "uses" | "depends_on";
  resourceImpact?: {
    cpuDelta: number;
    memoryDeltaMB: number;
  };
  temporalWindow?: {
    startOffsetMs: number;
    durationMs: number;
  };
}

export interface AdvancedGraphPayload {
  nodes: GraphNodePayload[];
  edges: GraphEdgePayload[];
}

export class DynamicToolDependencyGraphVisualizerAdvanced {
  private payload: AdvancedGraphPayload;

  constructor(payload: AdvancedGraphPayload) {
    this.payload = payload;
  }

  private getEdgeStyle(edge: GraphEdgePayload): {
    color: string;
    thickness: number;
  } {
    let baseColor = "#999";
    let thickness = 1;

    if (edge.dependencyType === "calls") {
      baseColor = "#007bff";
      thickness = 2;
    } else if (edge.dependencyType === "uses") {
      baseColor = "#28a745";
      thickness = 1.5;
    } else if (edge.dependencyType === "depends_on") {
      baseColor = "#ffc107";
      thickness = 2.5;
    }

    if (edge.resourceImpact) {
      const cpuRatio = Math.min(1, edge.resourceImpact.cpuDelta / 10);
      const memoryRatio = Math.min(1, edge.resourceImpact.memoryDeltaMB / 500);
      const intensity = Math.max(cpuRatio, memoryRatio);
      const alpha = 0.4 + intensity * 0.6;
      return { color: `rgba(${Math.floor(100 + intensity * 155)}, ${Math.floor(100 + intensity * 100)}, ${Math.floor(100 + intensity * 50)}, ${alpha})`, thickness: Math.max(1, 1 + intensity * 2) };
    }

    return { color: baseColor, thickness };
  }

  private getNodeStyle(node: GraphNodePayload): {
    backgroundColor: string;
    borderColor: string;
    size: number;
  } {
    let bgColor = "#e9ecef";
    let borderColor = "#adb5bd";
    let size = 20;

    if (node.type === "tool") {
      bgColor = "#d1ecf1";
      borderColor = "#bee5eb";
      size = 25;
    } else if (node.type === "user") {
      bgColor = "#d4edda";
      borderColor = "#c3e6cb";
      size = 22;
    } else if (node.type === "system") {
      bgColor = "#f8d7da";
      borderColor = "#f5c6cb";
      size = 20;
    }

    if (node.resourceProfile) {
      const cpuNorm = Math.min(1, node.resourceProfile.cpuUsage / 100);
      const memNorm = Math.min(1, node.resourceProfile.memoryUsageMB / 1024);
      const intensity = Math.max(cpuNorm, memNorm);
      const saturation = Math.floor(50 + intensity * 150);
      return { backgroundColor: `hsl(200, ${saturation}%, ${50 + intensity * 10}%)`, borderColor: `hsl(200, ${saturation}%, ${50 + intensity * 10}%)`, size: Math.max(20, 20 + intensity * 10) };
    }

    return { backgroundColor: bgColor, borderColor: borderColor, size };
  }

  public renderVisualization(): {
    nodes: {
      id: string;
      style: {
        backgroundColor: string;
        borderColor: string;
        size: number;
      };
    }[];
    edges: {
      sourceId: string;
      targetId: string;
      style: {
        color: string;
        thickness: number;
      };
    }[];
  } {
    const nodes = this.payload.nodes.map(node => ({
      id: node.id,
      style: this.getNodeStyle(node),
    }));

    const edges = this.payload.edges.map(edge => ({
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      style: this.getEdgeStyle(edge),
    }));

    return { nodes, edges };
  }
}