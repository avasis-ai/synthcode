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

export interface Node {
  id: string;
  label: string;
  type: "user" | "assistant" | "tool";
  metadata?: Record<string, unknown>;
}

export interface AdvancedEdgePayload {
  sourceId: string;
  targetId: string;
  dependencyType: "causal" | "informational" | "resource_constrained";
  timeWindowMs: number;
  resourceCost: {
    resourceName: string;
    costValue: number;
  }[];
}

export interface GraphVisualizationConfig {
  nodes: Node[];
  edges: AdvancedEdgePayload[];
  showAdvancedConstraints: boolean;
}

export class ContextualDependencyGraphVisualizer {
  private config: GraphVisualizationConfig;

  constructor(config: GraphVisualizationConfig) {
    this.config = config;
  }

  public renderGraph(): string {
    const { nodes, edges, showAdvancedConstraints } = this.config;

    let html = '<div class="dependency-graph-container">';

    html += '<h2>Contextual Dependency Graph</h2>';

    html += '<div class="graph-visualization" style="position: relative; height: 400px; border: 1px solid #ccc;">';

    // Render Nodes
    nodes.forEach((node) => {
      const nodeClass = `node node-${node.type}`;
      html += `<div class="${nodeClass}" id="node-${node.id}" style="position: absolute; top: ${Math.random() * 80 + 10}%; left: ${Math.random() * 80 + 10}%; transform: translate(-50%, -50%);">`;
      html += `<strong>${node.label}</strong><p>ID: ${node.id}</p>`;
      html += '</div>';
    });

    // Render Edges
    edges.forEach((edge) => {
      let edgeHtml = '';
      const style = `
        position: absolute;
        border-top: 2px dashed ${edge.dependencyType === "resource_constrained" ? 'orange' : 'gray'};
        transform: perspective(1000px) rotateX(0deg);
        transform-origin: 0 0;
        /* Simplified positioning for demonstration */
        width: 100%; height: 1px;
        top: 50%; left: 0%;
      `;

      if (showAdvancedConstraints) {
        edgeHtml += `<div class="advanced-edge-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(255, 165, 0, 0.1); pointer-events: none;">`;
        edgeHtml += `<div class="constraint-info">Time Window: ${edge.timeWindowMs}ms</div>`;
        edgeHtml += `<div class="constraint-info">Resources: ${edge.resourceCost.map(r => `${r.resourceName}:${r.costValue}`).join(', ')}</div>`;
        edgeHtml += '</div>';
      }

      html += `<div class="edge" style="${style}" data-source="${edge.sourceId}" data-target="${edge.targetId}">`;
      html += edgeHtml;
      html += '</div>';
    });

    html += '</div>';

    // Add basic styling for visualization context
    html += `
      <style>
        .dependency-graph-container { font-family: Arial, sans-serif; padding: 20px; }
        .graph-visualization { position: relative; width: 100%; height: 400px; background-color: #f9f9f9; }
        .node { padding: 10px; border: 1px solid #333; background-color: #e0f7fa; border-radius: 8px; box-shadow: 2px 2px 5px rgba(0,0,0,0.1); }
        .node-user { background-color: #e8f5e9; }
        .node-assistant { background-color: #fff3e0; }
        .node-tool { background-color: #f3e5f5; }
        .edge { position: absolute; top: 50%; left: 0; width: 100%; height: 1px; z-index: 1; }
        .advanced-edge-overlay { z-index: 2; opacity: 0.8; }
        .constraint-info { font-size: 0.8em; margin: 2px 0; color: #d35400; }
      </style>
    `;

    html += '</div>';
    return html;
  }
}