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
  cpuUsage: number;
  memoryUsage: number;
  durationMs: number;
}

export interface TemporalConstraint {
  startTimeMs: number;
  endTimeMs: number;
}

export interface GraphNode {
  id: string;
  name: string;
  resources: ResourceUsage;
  constraints: TemporalConstraint;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  weight: number;
  resources: ResourceUsage;
  constraints: TemporalConstraint;
}

export interface EnrichedGraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class ToolExecutionDependencyGraphVisualizerV134 {
  private payload: EnrichedGraphPayload;

  constructor(payload: EnrichedGraphPayload) {
    this.payload = payload;
  }

  private calculateNodeVisualMetrics(node: GraphNode): {
    color: string;
    borderWidth: number;
  } {
    const cpuRatio = node.resources.cpuUsage / 100.0;
    const memRatio = node.resources.memoryUsage / 100.0;
    const timeRatio = node.resources.durationMs / 1000.0;

    let color: string;
    let borderWidth: number;

    if (cpuRatio > 0.8 || memRatio > 0.8) {
      color = "red";
      borderWidth = 3;
    } else if (timeRatio > 1.5) {
      color = "orange";
      borderWidth = 2;
    } else {
      color = "green";
      borderWidth = 1;
    }
    return { color, borderWidth };
  }

  private calculateEdgeVisualMetrics(edge: GraphEdge): {
    gradient: string;
    thickness: number;
  } {
    const weightRatio = edge.weight / 5.0;
    const timeDelta = (edge.constraints.endTimeMs - edge.constraints.startTimeMs) / 1000.0;

    let gradient: string;
    let thickness: number;

    if (weightRatio > 0.7) {
      gradient = `linear-gradient(to right, blue, ${Math.min(1, weightRatio) * 255}, ${Math.max(0, 1 - weightRatio) * 255})`;
      thickness = 4;
    } else {
      gradient = "linear-gradient(to right, #ccc, #ccc)";
      thickness = 2;
    }
    return { gradient, thickness };
  }

  public renderGraph(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container element with ID "${containerId}" not found.`);
      return;
    }

    container.innerHTML = "<h2>Tool Execution Dependency Graph (V134)</h2>";

    const nodeMetrics = this.payload.nodes.map(this.calculateNodeVisualMetrics);
    const edgeMetrics = this.payload.edges.map(this.calculateEdgeVisualMetrics);

    let html = '<div style="display: flex; flex-wrap: wrap; gap: 20px;">';

    // Render Nodes
    this.payload.nodes.forEach((node, index) => {
      const metrics = nodeMetrics[index];
      html += `
        <div style="border: ${metrics.color} solid ${metrics.color}; border-width: ${metrics.borderWidth}px; padding: 15px; border-radius: 8px; background-color: #f9f9f9; min-width: 200px;">
          <h3>${node.name} (${node.id})</h3>
          <p><strong>CPU Usage:</strong> ${node.resources.cpuUsage.toFixed(1)}%</p>
          <p><strong>Memory Usage:</strong> ${node.resources.memoryUsage.toFixed(1)}%</p>
          <p><strong>Duration:</strong> ${node.resources.durationMs.toFixed(0)}ms</p>
          <p><strong>Time Window:</strong> ${node.constraints.startTimeMs}ms to ${node.constraints.endTimeMs}ms</p>
        </div>
      `;
    });

    html += '</div>';

    // Render Edges (Simplified representation for console output/DOM structure)
    html += '<h3 style="margin-top: 30px;">Dependencies (Edges)</h3>';
    html += '<div style="border: 1px dashed #ccc; padding: 15px;">';
    this.payload.edges.forEach((edge, index) => {
      const metrics = edgeMetrics[index];
      html += `
        <div style="margin-bottom: 10px; padding: 10px; border-left: 5px solid ${metrics.gradient.includes('blue') ? 'blue' : 'gray'}; background-color: #eee;">
          <strong>${edge.sourceId}</strong> &rarr; <strong>${edge.targetId}</strong> (Weight: ${edge.weight.toFixed(2)})
          <div style="margin-top: 5px;">
            <em>Time Constraint: ${edge.constraints.startTimeMs}ms to ${edge.constraints.endTimeMs}ms</em>
          </div>
          <div style="height: 5px; width: 100%; background: linear-gradient(to right, ${metrics.gradient}); margin-top: 5px;"></div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML += html;
  }
}