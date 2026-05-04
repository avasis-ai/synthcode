import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface TemporalConstraint {
  start: number;
  end: number;
  description: string;
}

export interface ResourceUsage {
  resourceId: string;
  usageAmount: number;
  unit: string;
}

export interface CapabilityLink {
  sourceCapability: string;
  targetCapability: string;
  strength: number;
}

export interface AdvancedMetadata {
  temporalConstraints?: TemporalConstraint[];
  resourceUsages?: ResourceUsage[];
  capabilityLinks?: CapabilityLink[];
}

export interface DependencyNode {
  id: string;
  label: string;
  metadata: AdvancedMetadata;
}

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  metadata: AdvancedMetadata;
}

export interface ContextualDependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface GraphVisualizerConfig {
  showTemporalConstraints: boolean;
  showResourceUsages: boolean;
  showCapabilityLinks: boolean;
}

export class ContextualDependencyGraphVisualizer {
  private graph: ContextualDependencyGraph;
  private config: GraphVisualizerConfig;

  constructor(graph: ContextualDependencyGraph, config: GraphVisualizerConfig = {
    showTemporalConstraints: true,
    showResourceUsages: true,
    showCapabilityLinks: true,
  }) {
    this.graph = graph;
    this.config = config;
  }

  public render(): string {
    let html = `<div><h2>Contextual Dependency Graph Visualizer</h2>`;

    if (!this.graph.nodes.length && !this.graph.edges.length) {
      html += `<p>No dependency data available to visualize.</p></div>`;
      return html;
    }

    html += `<div class="visualization-controls">`;
    html += `
      <label><input type="checkbox" id="toggle-temporal" ${this.config.showTemporalConstraints ? 'checked' : ''} onchange="updateVisualization()"> Show Temporal Constraints</label><br>
      <label><input type="checkbox" id="toggle-resource" ${this.config.showResourceUsages ? 'checked' : ''} onchange="updateVisualization()"> Show Resource Usages</label><br>
      <label><input type="checkbox" id="toggle-capability" ${this.config.showCapabilityLinks ? 'checked' : ''} onchange="updateVisualization()"> Show Capability Links</label>
    `;
    html += `</div>`;

    html += `<div id="graph-container" style="border: 1px solid #ccc; padding: 20px; min-height: 300px;">`;

    // Placeholder for complex SVG/Canvas rendering logic
    html += `<h3>Nodes (${this.graph.nodes.length})</h3>`;
    this.graph.nodes.forEach(node => {
      html += `<div class="node" id="node-${node.id}"><strong>${node.label}</strong>`;
      html += `<p>Metadata:</p><ul>`;
      if (node.metadata.temporalConstraints && node.metadata.temporalConstraints.length > 0) {
        html += `<li>Temporal: ${node.metadata.temporalConstraints.length} constraints detected.</li>`;
      }
      if (node.metadata.resourceUsages && node.metadata.resourceUsages.length > 0) {
        html += `<li>Resources: ${node.metadata.resourceUsages.length} usages detected.</li>`;
      }
      if (node.metadata.capabilityLinks && node.metadata.capabilityLinks.length > 0) {
        html += `<li>Capabilities: ${node.metadata.capabilityLinks.length} links detected.</li>`;
      }
      html += `</ul></div>`;
    });

    html += `<h3>Edges (${this.graph.edges.length})</h3>`;
    this.graph.edges.forEach(edge => {
      html += `<div class="edge" id="edge-${edge.sourceId}-${edge.targetId}"><strong>${edge.sourceId} -> ${edge.targetId}</strong>`;
      html += `<p>Metadata:</p><ul>`;
      if (edge.metadata.temporalConstraints && edge.metadata.temporalConstraints.length > 0) {
        html += `<li>Temporal: ${edge.metadata.temporalConstraints.length} constraints detected.</li>`;
      }
      if (edge.metadata.resourceUsages && edge.metadata.resourceUsages.length > 0) {
        html += `<li>Resources: ${edge.metadata.resourceUsages.length} usages detected.</li>`;
      }
      if (edge.metadata.capabilityLinks && edge.metadata.capabilityLinks.length > 0) {
        html += `<li>Capabilities: ${edge.metadata.capabilityLinks.length} links detected.</li>`;
      }
      html += `</ul></div>`;
    });

    html += `</div></div>`;
    return html;
  }

  public updateConfig(newConfig: Partial<GraphVisualizerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}