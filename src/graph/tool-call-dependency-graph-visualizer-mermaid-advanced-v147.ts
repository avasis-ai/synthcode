import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type FlowControlNode = {
  id: string;
  type: "start" | "tool_call" | "conditional" | "end";
  label: string;
  details?: Record<string, any>;
};

export type FlowEdge = {
  from: string;
  to: string;
  condition?: "success" | "failure" | "timeout" | "default";
  label: string;
};

export type AdvancedGraphStructure = {
  nodes: FlowControlNode[];
  edges: FlowEdge[];
};

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV147 {
  private graphStructure: AdvancedGraphStructure;

  constructor(graphStructure: AdvancedGraphStructure) {
    this.graphStructure = graphStructure;
  }

  private mapNodeToMermaidId(node: FlowControlNode): string {
    return node.id;
  }

  private mapEdgeToMermaidLink(edge: FlowEdge): string {
    let link = `${this.mapNodeToMermaidId(this.graphStructure.nodes.find(n => n.id === edge.from)!)}-${this.mapNodeToMermaidId(this.graphStructure.nodes.find(n => n.id === edge.to)!)}:`;

    if (edge.condition) {
      switch (edge.condition) {
        case "success":
          return `${link} -- Success -->`;
        case "failure":
          return `${link} -- Failure -->`;
        case "timeout":
          return `${link} -- Timeout -->`;
        case "default":
          return `${link} -- Default -->`;
        default:
          return `${link} -- -->`;
      }
    }
    return `${link} -- -->`;
  }

  private generateMermaidGraphDefinition(graph: AdvancedGraphStructure): string {
    let mermaid = "graph TD\n";

    const nodeStyles: Record<string, string> = {
      start: "style { fill:#ccf,stroke:#333,stroke-width:2px }",
      tool_call: "style { fill:#cff,stroke:#333,stroke-width:2px }",
      conditional: "style { fill:#ffc,stroke:#333,stroke-width:2px }",
      end: "style { fill:#fcc,stroke:#333,stroke-width:2px }",
    };

    // 1. Define Nodes
    graph.nodes.forEach(node => {
      const id = this.mapNodeToMermaidId(node);
      const style = nodeStyles[node.type] || "";
      mermaid += `${id}["${node.label}"] ${style}\n`;
    });

    // 2. Define Edges
    graph.edges.forEach(edge => {
      mermaid += this.mapEdgeToMermaidLink(edge) + ` "${edge.label}"\n`;
    });

    return mermaid;
  }

  public renderMermaidGraph(): string {
    if (!this.graphStructure.nodes || !this.graphStructure.edges) {
      return "graph TD\nA[\"No graph structure provided\"]";
    }

    return this.generateMermaidGraphDefinition(this.graphStructure);
  }
}