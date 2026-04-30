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

export interface ResourceConstraint {
  resourceName: string;
  requiredAmount: number;
  unit: "CPU" | "Memory" | "GPU";
}

export interface TemporalDependency {
  startTimeMs: number;
  endTimeMs: number;
  dependencyType: "precedes" | "overlaps";
}

export interface AdvancedNodePayload {
  id: string;
  name: string;
  toolCallId: string;
  dependencies: string[];
  resourceConstraints?: ResourceConstraint[];
  temporalDependencies?: TemporalDependency[];
}

export interface AdvancedEdgePayload {
  sourceId: string;
  targetId: string;
  dependencyType: "calls" | "data_flow" | "constraint";
  resourceFlow?: ResourceConstraint[];
  temporalFlow?: TemporalDependency[];
}

export interface DependencyGraphData {
  nodes: AdvancedNodePayload[];
  edges: AdvancedEdgePayload[];
}

export class ToolExecutionDependencyGraphVisualizer {
  private graphData: DependencyGraphData;

  constructor(data: DependencyGraphData) {
    this.graphData = data;
  }

  public visualize(): string {
    let html = `
      <div class="dependency-graph-container">
        <h2>Advanced Tool Execution Dependency Graph</h2>
        <div class="graph-visualization">
    `;

    this.graphData.nodes.forEach(node => {
      html += this.renderNode(node);
    });

    this.graphData.edges.forEach(edge => {
      html += this.renderEdge(edge);
    });

    html += `
        </div>
      </div>
    `;
    return html;
  }

  private renderNode(node: AdvancedNodePayload): string {
    let constraintsHtml = node.resourceConstraints
      ? node.resourceConstraints.map(c => `<li>${c.resourceName}: ${c.requiredAmount}${c.unit}</li>`).join("")
      : "";

    let timeHtml = node.temporalDependencies
      ? node.temporalDependencies.map(t => `<li>${t.dependencyType}: ${t.startTimeMs}ms to ${t.endTimeMs}ms</li>`).join("")
      : "";

    return `
      <div class="graph-node" id="node-${node.id}">
        <h3>${node.name} (Tool: ${node.toolCallId})</h3>
        <p>Dependencies: ${node.dependencies.join(', ') || 'None'}</p>
        ${constraintsHtml ? `<h4>Resource Constraints:</h4><ul>${constraintsHtml}</ul>` : ''}
        ${timeHtml ? `<h4>Temporal Dependencies:</h4><ul>${timeHtml}</ul>` : ''}
      </div>
    `;
  }

  private renderEdge(edge: AdvancedEdgePayload): string {
    let resourceFlowHtml = edge.resourceFlow
      ? edge.resourceFlow.map(c => `<li>${c.resourceName} flow: ${c.requiredAmount}${c.unit}</li>`).join("")
      : "";

    let timeFlowHtml = edge.temporalFlow
      ? edge.temporalFlow.map(t => `<li>${t.dependencyType} flow: ${t.startTimeMs}ms to ${t.endTimeMs}ms</li>`).join("")
      : "";

    return `
      <div class="graph-edge" id="edge-${edge.sourceId}-${edge.targetId}">
        <p><strong>${edge.sourceId}</strong> --(${edge.dependencyType})--> <strong>${edge.targetId}</strong></p>
        ${resourceFlowHtml ? `<div>Resource Flow: <ul>${resourceFlowHtml}</ul></div>` : ''}
        ${timeFlowHtml ? `<div>Temporal Flow: <ul>${timeFlowHtml}</ul></div>` : ''}
      </div>
    `;
  }
}