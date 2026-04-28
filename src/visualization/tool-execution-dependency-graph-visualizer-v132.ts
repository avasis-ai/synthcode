import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "../types";

export interface ResourceUsage {
  resourceName: string;
  requiredAmount: number;
  unit: string;
}

export interface TemporalConstraint {
  startTimeMs: number;
  endTimeMs: number;
}

export interface NodeMetrics {
  nodeId: string;
  durationMs: number;
  resources: ResourceUsage[];
  temporal: TemporalConstraint;
}

export interface EdgeMetrics {
  sourceId: string;
  targetId: string;
  latencyMs: number;
  resourceContention: {
    resourceName: string;
    overlapDurationMs: number;
  }[];
}

export interface GraphPayload {
  nodes: Record<string, NodeMetrics>;
  edges: Record<string, EdgeMetrics>;
  executionOrder: string[];
}

export class ToolExecutionDependencyGraphVisualizer {
  private payload: GraphPayload;

  constructor(payload: GraphPayload) {
    this.payload = payload;
  }

  private calculateResourceBottleneck(edgeMetrics: EdgeMetrics): string {
    const contention = edgeMetrics.resourceContention;
    if (contention.length === 0) {
      return "Normal";
    }
    const maxOverlap = Math.max(...contention.map(c => c.overlapDurationMs));
    if (maxOverlap > 100) {
      return "High Contention";
    }
    return "Moderate Contention";
  }

  private renderNode(nodeId: string): string {
    const node = this.payload.nodes[nodeId];
    if (!node) return "";

    const resourceSummary = node.resources.map(r => `${r.resourceName}: ${r.requiredAmount}${r.unit}`).join(", ");
    const temporalInfo = `[${node.temporal.startTimeMs}ms - ${node.temporal.endTimeMs}ms]`;

    return `
      <div class="graph-node" id="${nodeId}" style="border-left: 5px solid ${this.getResourceColor(node.resources)};">
        <h4>${nodeId}</h4>
        <p>Time: ${temporalInfo}</p>
        <p>Duration: ${node.durationMs}ms</p>
        <p>Resources: ${resourceSummary}</p>
      </div>`;
  }

  private renderEdge(edgeMetrics: EdgeMetrics): string {
    const style = this.calculateResourceBottleneck(edgeMetrics);
    const resourceDetails = edgeMetrics.resourceContention.map(c => `${c.resourceName} (${c.overlapDurationMs}ms)`).join(", ");

    return `
      <div class="graph-edge" style="border-color: ${this.getEdgeColor(style)};">
        <p>From: ${edgeMetrics.sourceId} -> To: ${edgeMetrics.targetId}</p>
        <p>Latency: ${edgeMetrics.latencyMs}ms</p>
        <p>Contention: ${resourceDetails}</p>
      </div>`;
  }

  private getResourceColor(resources: ResourceUsage[]): string {
    if (resources.some(r => r.resourceName.includes("GPU") && r.requiredAmount > 5)) {
      return "#ff4444";
    }
    return "#44aaff";
  }

  private getEdgeColor(style: string): string {
    switch (style) {
      case "High Contention":
        return "#cc0000";
      case "Moderate Contention":
        return "#ffaa00";
      default:
        return "#008800";
    }
  }

  public renderGraph(filterResource: string | null, timeWindowMs: { start: number; end: number } | null): string {
    let nodesHtml = "";
    let edgesHtml = "";

    Object.keys(this.payload.nodes).forEach(nodeId => {
      const node = this.payload.nodes[nodeId];
      const passesResourceFilter = !filterResource || node.resources.some(r => r.resourceName.toLowerCase().includes(filterResource.toLowerCase()));
      const passesTimeFilter = !timeWindowMs || (node.temporal.startTimeMs >= timeWindowMs.start && node.temporal.endTimeMs <= timeWindowMs.end);

      if (passesResourceFilter && passesTimeFilter) {
        nodesHtml += this.renderNode(nodeId);
      }
    });

    Object.keys(this.payload.edges).forEach(edgeId => {
      const edge = this.payload.edges[edgeId];
      // Simplified edge filtering for demonstration
      edgesHtml += this.renderEdge(edge);
    });

    return `
      <div class="dependency-graph-visualizer">
        <h3>Execution Dependency Graph</h3>
        <div class="graph-controls">
          <label>Filter Resource: <input type="text" id="resource-filter" value="${filterResource || ''}"></label>
          <label>Time Window (ms): <input type="number" id="start-time" value="${timeWindowMs?.start || ''}"> to <input type="number" id="end-time" value="${timeWindowMs?.end || ''}"></label>
          <button id="apply-filter">Apply Filters</button>
        </div>
        <div class="graph-visualization">
          <h4>Nodes (${nodesHtml.split('<div class="graph-node"').length - 1} visible)</h4>
          <div class="nodes-container">${nodesHtml}</div>
          <h4>Edges</h4>
          <div class="edges-container">${edgesHtml}</div>
        </div>
      </div>`;
  }
}