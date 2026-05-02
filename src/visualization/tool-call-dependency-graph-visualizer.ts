import { Message, ToolUseBlock, TextBlock } from "./types";

export interface ToolCallNode {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface ToolCallEdge {
  fromNodeId: string;
  toNodeId: string;
  dependencyType: "input_to_input" | "output_to_input";
  description: string;
}

export class ToolCallDependencyGraphVisualizer {
  private nodes: ToolCallNode[];
  private edges: ToolCallEdge[];

  constructor(nodes: ToolCallNode[], edges: ToolCallEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  public renderGraphStructure(): { nodes: ToolCallNode[]; edges: ToolCallEdge[] } {
    return {
      nodes: this.nodes,
      edges: this.edges,
    };
  }

  public visualize(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container element with ID "${containerId}" not found.`);
      return;
    }

    container.innerHTML = "<h2>Tool Call Dependency Graph</h2>";

    const renderNodes = (nodes: ToolCallNode[]) => {
      const nodeContainer = document.createElement("div");
      nodeContainer.className = "tool-call-nodes";
      nodes.forEach(node => {
        const nodeElement = document.createElement("div");
        nodeElement.className = "tool-node";
        nodeElement.innerHTML = `
          <h3>${node.name} (${node.id})</h3>
          <p><strong>Input:</strong> ${JSON.stringify(node.input)}</p>
          ${node.output ? `<p><strong>Output:</strong> ${JSON.stringify(node.output)}</p>` : ''}
        `;
        nodeContainer.appendChild(nodeElement);
      });
      return nodeContainer;
    };

    const renderEdges = (edges: ToolCallEdge[]) => {
      const edgeContainer = document.createElement("div");
      edgeContainer.className = "tool-call-edges";
      edges.forEach(edge => {
        const edgeElement = document.createElement("div");
        edgeElement.className = "tool-edge";
        edgeElement.innerHTML = `
          <p><strong>${edge.fromNodeId}</strong> $\\xrightarrow{${edge.dependencyType}}$ <strong>${edge.toNodeId}</strong></p>
          <small>Dependency: ${edge.description}</small>
        `;
        edgeContainer.appendChild(edgeElement);
      });
      return edgeContainer;
    };

    const nodeContainer = renderNodes(this.nodes);
    const edgeContainer = renderEdges(this.edges);

    container.appendChild(nodeContainer);
    container.appendChild(document.createElement("hr"));
    container.appendChild(edgeContainer);
  }
}