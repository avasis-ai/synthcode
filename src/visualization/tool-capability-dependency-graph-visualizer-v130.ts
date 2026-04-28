import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface CapabilityNode {
  id: string;
  name: string;
  type: "tool" | "capability";
  description: string;
  resources?: Record<string, number>;
}

export interface DependencyEdge {
  source: string;
  target: string;
  dependencyType: "requires" | "provides";
  reason: string;
}

export interface CapabilityGraph {
  nodes: CapabilityNode[];
  edges: DependencyEdge[];
}

export class ToolCapabilityDependencyGraphVisualizer {
  private graph: CapabilityGraph;

  constructor(graph: CapabilityGraph) {
    this.graph = graph;
  }

  public renderVisualization(): string {
    const nodes = this.graph.nodes;
    const edges = this.graph.edges;

    let mermaidDefinition = "graph TD;\n";

    // 1. Define Nodes
    nodes.forEach(node => {
      let nodeStyle = `style${node.id} fill:#f9f,stroke:#333,stroke-width:2px`;
      if (node.type === "tool") {
        nodeStyle = `style${node.id} fill:#ccf,stroke:#007bff,stroke-width:2px`;
      } else if (node.type === "capability") {
        nodeStyle = `style${node.id} fill:#cfc,stroke:#28a745,stroke-width:2px`;
      }

      let resourceInfo = "";
      if (node.resources) {
        const resourceList = Object.entries(node.resources)
          .map(([key, value]) => `${key}:${value}`)
          .join(", ");
        resourceInfo = `[Resources: ${resourceList}]`;
      }

      mermaidDefinition += `${node.id}["${node.name}\\n${node.description}${resourceInfo}"]${nodeStyle};\n`;
    });

    // 2. Define Edges
    edges.forEach(edge => {
      let linkStyle = "";
      if (edge.dependencyType === "requires") {
        linkStyle = `linkStyle ${edge.source} --> ${edge.target} stroke:#dc3545,stroke-width:2px,stroke-dasharray: 5 5;`;
      } else {
        linkStyle = `linkStyle ${edge.source} --> ${edge.target} stroke:#28a745,stroke-width:2px;`;
      }
      mermaidDefinition += `${edge.source} -- ${edge.dependencyType} (${edge.reason}) --> ${edge.target};\n`;
    });

    // 3. Assemble final Mermaid graph definition (Simplified for output)
    const finalGraph = `
    ${mermaidDefinition}
    %% Mermaid Graph Definition for Tool/Capability Dependencies
    `;

    return finalGraph;
  }

  public getGraphData(): { nodes: CapabilityNode[]; edges: DependencyEdge[] } {
    return { nodes: this.graph.nodes, edges: this.graph.edges };
  }
}