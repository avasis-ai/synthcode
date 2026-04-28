import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; result: string };

export interface NodeMetadata {
  id: string;
  label: string;
  type: "tool" | "agent" | "user";
  startTime: number;
  endTime: number;
  resourceUsage: {
    cpu: number;
    memory: number;
  };
}

export interface EdgeMetadata {
  fromNodeId: string;
  toNodeId: string;
  weight: number;
  duration: number;
  resourceFlow: {
    dataSize: number;
    bandwidth: number;
  };
}

export interface EnrichedGraphData {
  nodes: NodeMetadata[];
  edges: EdgeMetadata[];
  dependencies: {
    sourceId: string;
    targetId: string;
    metadata: {
      temporalConstraint?: string;
      requiredResource?: string;
    };
  }[];
}

export class DynamicToolDependencyGraphVisualizer {
  private graphData: EnrichedGraphData;

  constructor(graphData: EnrichedGraphData) {
    this.graphData = graphData;
  }

  private calculateNodeMetrics(nodes: NodeMetadata[]): Map<string, { duration: number; avgCpu: number }> {
    const metrics = new Map<string, { duration: number; avgCpu: number }>();
    for (const node of nodes) {
      const duration = node.endTime - node.startTime;
      const avgCpu = node.resourceUsage.cpu;
      metrics.set(node.id, { duration, avgCpu });
    }
    return metrics;
  }

  private calculateEdgeMetrics(edges: EdgeMetadata[]): Map<string, { totalDuration: number; totalData: number }> {
    const metrics = new Map<string, { totalDuration: number; totalData: number }>();
    for (const edge of edges) {
      const key = `${edge.fromNodeId}->${edge.toNodeId}`;
      if (!metrics.has(key)) {
        metrics.set(key, { totalDuration: 0, totalData: 0 });
      }
      const current = metrics.get(key)!;
      metrics.set(key, {
        totalDuration: current.totalDuration + edge.duration,
        totalData: current.totalData + edge.resourceFlow.dataSize,
      });
    }
    return metrics;
  }

  public renderVisualization(): string {
    const nodeMetrics = this.calculateNodeMetrics(this.graphData.nodes);
    const edgeMetrics = this.calculateEdgeMetrics(this.graphData.edges);

    let output = "--- Dynamic Tool Dependency Graph Visualization Report ---\n";

    output += "\n[Node Analysis]\n";
    this.graphData.nodes.forEach(node => {
      const metrics = nodeMetrics.get(node.id)!;
      output += `Node ${node.id} (${node.label}): Duration=${metrics.duration.toFixed(2)}ms, Avg CPU=${metrics.avgCpu.toFixed(2)}.\n`;
    });

    output += "\n[Edge Analysis]\n";
    edgeMetrics.forEach((metrics, key) => {
      output += `Edge ${key}: Total Duration=${metrics.totalDuration.toFixed(2)}ms, Total Data=${metrics.totalData.toFixed(2)} units.\n`;
    });

    output += "\n[Dependency Constraints]\n";
    this.graphData.dependencies.forEach((dep, index) => {
      let constraintStr = "";
      if (dep.metadata.temporalConstraint) {
        constraintStr += `Temporal: ${dep.metadata.temporalConstraint}. `;
      }
      if (dep.metadata.requiredResource) {
        constraintStr += `Resource: ${dep.metadata.requiredResource}. `;
      }
      output += `Dependency ${index + 1} (${dep.sourceId} -> ${dep.targetId}): ${constraintStr.trim()}\n`;
    });

    output += "\n--- Visualization Complete ---";
    return output;
  }
}