import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface TemporalResourceNode {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  resourceUsage: Record<string, number>;
}

export interface TemporalResourceEdge {
  sourceId: string;
  targetId: string;
  duration: number;
  dependencyType: "causal" | "temporal" | "resource";
}

export interface TemporalGraphPayload {
  nodes: TemporalResourceNode[];
  edges: TemporalResourceEdge[];
  metadata: Record<string, any>;
}

export class ToolExecutionDependencyGraphVisualizer {
  private graphData: TemporalGraphPayload;

  constructor(initialData: TemporalGraphPayload) {
    this.graphData = initialData;
  }

  public setGraphData(data: TemporalGraphPayload): void {
    this.graphData = data;
  }

  private renderNodeVisuals(node: TemporalResourceNode): string {
    const duration = node.endTime - node.startTime;
    const resourceDetails = Object.entries(node.resourceUsage)
      .map(([resource, usage]) => `${resource}: ${usage.toFixed(1)}`)
      .join(", ");

    return `
      <div class="node-visual" style="background-color: #e0f7fa; border-left: 5px solid #00bcd4; padding: 10px; margin: 10px; border-radius: 4px;">
        <strong>${node.label}</strong> (ID: ${node.id})<br>
        Time Window: ${node.startTime.toFixed(0)} - ${node.endTime.toFixed(0)} (${duration.toFixed(0)} units)<br>
        Resources Used: ${resourceDetails || 'None'}<br>
      </div>`;
  }

  private renderEdgeVisuals(edge: TemporalResourceEdge): string {
    let typeColor = "gray";
    if (edge.dependencyType === "causal") {
      typeColor = "blue";
    } else if (edge.dependencyType === "temporal") {
      typeColor = "orange";
    } else if (edge.dependencyType === "resource") {
      typeColor = "red";
    }

    return `
      <div class="edge-visual" style="border-bottom: 2px dashed ${typeColor}; margin: 5px 0;">
        ${edge.sourceId} --(${edge.dependencyType})--> ${edge.targetId} (Duration: ${edge.duration.toFixed(1)})
      </div>`;
  }

  public renderVisualization(): string {
    let nodeHtml = this.graphData.nodes.map(this.renderNodeVisuals).join('');
    let edgeHtml = this.graphData.edges.map(this.renderEdgeVisuals).join('');

    return `
      <div class="temporal-graph-container">
        <h2>Temporal Execution Dependency Graph</h2>
        <div class="graph-nodes">
          <h3>Nodes (Tools/Steps):</h3>
          ${nodeHtml}
        </div>
        <div class="graph-edges">
          <h3>Dependencies (Edges):</h3>
          ${edgeHtml}
        </div>
        <p><em>Visualization successfully rendered temporal constraints and resource usage.</em></p>
      </div>`;
  }

  public visualize(payload: TemporalGraphPayload): string {
    this.setGraphData(payload);
    return this.renderVisualization();
  }
}