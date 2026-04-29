import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ConstraintMetadata {
  temporal?: {
    startTime: number;
    endTime: number;
    window?: { start: number; end: number };
  };
  resource?: {
    resourceName: string;
    limit: number;
    required?: number;
  };
}

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  metadata: ConstraintMetadata;
}

export interface NodeData {
  id: string;
  type: "message" | "tool_call" | "context";
  content: any; // Simplified for this context
  constraints: ConstraintMetadata;
}

export interface DependencyGraphData {
  nodes: NodeData[];
  edges: DependencyEdge[];
}

export class ContextualDependencyGraphVisualizerV159 {
  private graphData: DependencyGraphData;

  constructor(graphData: DependencyGraphData) {
    this.graphData = graphData;
  }

  private renderNode(node: NodeData): string {
    let html = `<div>Node ${node.id} (${node.type})</div>`;
    if (node.constraints) {
      html += `<div class="constraints">Constraints: ${this.formatConstraints(node.constraints)}</div>`;
    }
    return html;
  }

  private renderEdge(edge: DependencyEdge): string {
    let style = "border-style: solid; ";
    let label = "";
    if (edge.metadata) {
      style += "border-color: blue; ";
      label = this.formatConstraints(edge.metadata);
    }
    return `<div style="${style}">Edge ${edge.sourceId} -> ${edge.targetId} [${label}]</div>`;
  }

  private formatConstraints(metadata: ConstraintMetadata): string {
    let parts: string[] = [];
    if (metadata.temporal) {
      let timeStr = `Time: [${metadata.temporal.startTime} - ${metadata.temporal.endTime}]`;
      if (metadata.temporal.window) {
        timeStr += ` (Window: ${metadata.temporal.window.start}-${metadata.temporal.window.end})`;
      }
      parts.push(timeStr);
    }
    if (metadata.resource) {
      let resStr = `Resource: ${metadata.resource.resourceName} (Limit: ${metadata.resource.limit})`;
      if (metadata.resource.required !== undefined) {
        resStr += `, Required: ${metadata.resource.required}`;
      }
      parts.push(resStr);
    }
    return parts.join(" | ");
  }

  public renderGraph(showConstraints: boolean): string {
    let nodeHtml = this.graphData.nodes.map(this.renderNode).join("<hr>");
    let edgeHtml = this.graphData.edges.map(edge => {
      if (!showConstraints) {
        return this.renderEdge({ ...edge, metadata: undefined });
      }
      return this.renderEdge(edge);
    }).join("<hr>");

    return `
      <div class="dependency-graph">
        <h2>Contextual Dependency Graph (v159)</h2>
        <p>Constraint Display: ${showConstraints ? 'ON' : 'OFF'}</p>
        <h3>Nodes</h3>
        ${nodeHtml}
        <h3>Edges</h3>
        ${edgeHtml}
      </div>
    `;
  }
}