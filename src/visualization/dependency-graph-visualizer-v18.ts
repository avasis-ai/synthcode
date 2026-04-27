import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

interface Constraint {
  type: "temporal" | "resource";
  value: any;
  description: string;
}

interface GraphNode {
  id: string;
  label: string;
  data: Record<string, unknown>;
  constraints: Constraint[];
}

interface GraphEdge {
  sourceId: string;
  targetId: string;
  type: "dependency" | "constraint";
  constraints: Constraint[];
}

interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class ToolExecutionDependencyGraphVisualizerV18 {
  private graphData: DependencyGraph;

  constructor(graphData: DependencyGraph) {
    this.graphData = graphData;
  }

  private getConstraintStyle(constraint: Constraint): string {
    switch (constraint.type) {
      case "temporal":
        return "stroke: red; stroke-dasharray: 5, 5;";
      case "resource":
        return "stroke: blue; stroke-width: 3;";
      default:
        return "";
    }
  }

  private renderNode(node: GraphNode): string {
    let html = `<div class="graph-node" id="${node.id}">`;
    html += `<h3>${node.label}</h3>`;
    html += `<p>Constraints:</p><ul>`;
    node.constraints.forEach(c => {
      html += `<li>[${c.type.toUpperCase()}]: ${c.description} (Value: ${JSON.stringify(c.value)})</li>`;
    });
    html += `</ul>`;
    html += `</div>`;
    return html;
  }

  private renderEdge(edge: GraphEdge): string {
    let style = "";
    let constraintInfo = "";

    if (edge.constraints.length > 0) {
      const constraintStyles = edge.constraints.map(c => this.getConstraintStyle(c)).join(" ");
      style = `style="${constraintStyles}"`;
      constraintInfo = `<p>Constraints: ${edge.constraints.map(c => `[${c.type}]: ${c.description}`).join(", ")}</p>`;
    }

    return `<div class="graph-edge" ${style}>${constraintInfo}</div>`;
  }

  public renderVisualization(): string {
    let nodeHtml = this.graphData.nodes.map(this.renderNode).join("");
    let edgeHtml = this.graphData.edges.map(this.renderEdge).join("");

    return `
      <div class="dependency-graph-container">
        <h2>Execution Dependency Graph (V18)</h2>
        <div class="graph-visualization-area">
          <div class="nodes-container">${nodeHtml}</div>
          <div class="edges-container">${edgeHtml}</div>
        </div>
        <style>
          .dependency-graph-container { font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ccc; }
          .graph-visualization-area { display: flex; gap: 40px; }
          .nodes-container, .edges-container { flex: 1; }
          .graph-node { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px; background-color: #f9f9f9; }
          .graph-edge { border-left: 3px solid #aaa; padding-left: 10px; margin-bottom: 10px; background-color: #eee; }
          .graph-edge[style*="red"] { border-left-color: red !important; }
          .graph-edge[style*="blue"] { border-left-color: blue !important; }
        </style>
        ${edgeHtml}
      </div>
    `;
  }
}