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
  resourceName: string;
  amount: number;
  unit: string;
}

export interface TemporalConstraint {
  startTime: number;
  endTime: number;
  duration: number;
}

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  weight: number;
  temporal: TemporalConstraint;
  resources: ResourceUsage[];
}

export interface DependencyNode {
  id: string;
  label: string;
  metadata: Record<string, any>;
  temporal: TemporalConstraint;
  resources: ResourceUsage[];
}

export interface ContextualDependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export class ContextualDependencyGraphVisualizer {
  private graph: ContextualDependencyGraph;

  constructor(graph: ContextualDependencyGraph) {
    this.graph = graph;
  }

  public renderGraph(): string {
    const nodeHtml = this.graph.nodes.map(node => this.renderNode(node)).join("");
    const edgeHtml = this.graph.edges.map(edge => this.renderEdge(edge)).join("");

    return `
      <div class="dependency-graph-container">
        <h2>Contextual Dependency Graph Visualization</h2>
        <div class="graph-visualization">
          <div class="nodes">${nodeHtml}</div>
          <div class="edges">${edgeHtml}</div>
        </div>
        <style>
          .dependency-graph-container { font-family: sans-serif; padding: 20px; border: 1px solid #ccc; }
          .graph-visualization { display: flex; gap: 20px; }
          .nodes, .edges { flex: 1; padding: 10px; border: 1px dashed #eee; }
          .node-element { border: 1px solid #3498db; padding: 10px; margin-bottom: 15px; border-radius: 5px; background-color: #ecf0f1; }
          .node-label { font-weight: bold; display: block; margin-bottom: 5px; }
          .temporal-bar { height: 10px; background-color: #2ecc71; margin-top: 5px; border-radius: 2px; position: relative; }
          .resource-bar { display: inline-block; width: 100%; height: 15px; margin-top: 5px; background-color: #f39c12; border-radius: 3px; }
          .edge-element { border-left: 3px solid #e74c3c; padding: 5px 10px; margin-bottom: 10px; background-color: #fdeded; }
          .resource-list { font-size: 0.9em; color: #7f8c8d; }
        </style>
      </div>
    `;
  }

  private renderNode(node: DependencyNode): string {
    const resourceDetails = node.resources.map(r => 
      `<div class="resource-bar" title="${r.resourceName}: ${r.amount} ${r.unit}" style="width: ${Math.min(100, r.amount * 5)}%;"></div>`
    ).join("");

    return `
      <div class="node-element" id="node-${node.id}">
        <span class="node-label">${node.label} (ID: ${node.id})</span>
        <p><strong>Temporal Span:</strong> ${node.temporal.startTime} to ${node.temporal.endTime} (${node.temporal.duration} units)</p>
        <div class="temporal-bar" style="width: 100%; background-color: #2ecc71; position: relative;"></div>
        <p><strong>Resource Usage:</strong></p>
        <div class="resource-list">${resourceDetails || 'None'}</div>
        <small>Metadata: ${JSON.stringify(node.metadata)}</small>
      </div>
    `;
  }

  private renderEdge(edge: DependencyEdge): string {
    const resourceDetails = edge.resources.map(r => 
      `<span style="margin-right: 10px; color: #c0392b;">${r.resourceName}: ${r.amount} ${r.unit}</span>`
    ).join("");

    return `
      <div class="edge-element" title="Weight: ${edge.weight}">
        <strong>${edge.sourceId}</strong> $\\rightarrow$ <strong>${edge.targetId}</strong> (Weight: ${edge.weight.toFixed(2)})<br>
        <small>Time: ${edge.temporal.startTime} to ${edge.temporal.endTime}</small><br>
        <div class="resource-list">Resources: ${resourceDetails || 'None'}</div>
      </div>
    `;
  }
}

export const createVisualizer = (graph: ContextualDependencyGraph): ContextualDependencyGraphVisualizer => {
  return new ContextualDependencyGraphVisualizer(graph);
};