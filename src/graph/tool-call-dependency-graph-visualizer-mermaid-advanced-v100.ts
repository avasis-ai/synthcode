import { Message, ContentBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface AdvancedNodeMetadata {
  id: string;
  label: string;
  type: "user" | "assistant" | "tool_result" | "thinking";
  metadata?: Record<string, any>;
}

export interface AdvancedEdgeMetadata {
  fromNodeId: string;
  toNodeId: string;
  label: string;
  style?: "success" | "failure" | "info";
  metadata?: Record<string, any>;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV100 {
  private nodes: AdvancedNodeMetadata[];
  private edges: AdvancedEdgeMetadata[];

  constructor(nodes: AdvancedNodeMetadata[], edges: AdvancedEdgeMetadata[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private getNodeDefinition(node: AdvancedNodeMetadata): string {
    let shape = "rounded";
    let classDef = "";

    switch (node.type) {
      case "user":
        shape = "rectangle";
        classDef = "user_node";
        break;
      case "assistant":
        shape = "stadium";
        classDef = "assistant_node";
        break;
      case "tool_result":
        shape = "hexagon";
        classDef = "tool_result_node";
        break;
      case "thinking":
        shape = "diamond";
        classDef = "thinking_node";
        break;
    }

    const content = node.metadata?.content || node.label;

    return `${node.id}["${node.label}\\n(${node.type})"]:::${classDef}:::${shape}`;
  }

  private getEdgeDefinition(edge: AdvancedEdgeMetadata): string {
    let styleSyntax = "";
    let linkStyle = "";

    switch (edge.style) {
      case "success":
        styleSyntax = "style ${edge.fromNodeId} --> ${edge.toNodeId} stroke:#0a0,stroke-width:2px";
        break;
      case "failure":
        styleSyntax = "style ${edge.fromNodeId} --> ${edge.toNodeId} stroke:#a00,stroke-width:2px,stroke-dasharray: 5 5";
        break;
      case "info":
        styleSyntax = "style ${edge.fromNodeId} --> ${edge.toNodeId} stroke:#00f,stroke-width:2px";
        break;
    }

    const labelSyntax = edge.label ? ` --> ${edge.label}` : " -->";

    return `${linkStyle}${labelSyntax}${styleSyntax}`;
  }

  public renderMermaidGraph(): string {
    let graph = "graph TD\n";

    // 1. Define Styles (CSS-like definitions for Mermaid)
    graph += `classDef user_node fill:#e6f7ff,stroke:#1890ff,stroke-width:2px;\n`;
    graph += `classDef assistant_node fill:#fff1e6,stroke:#faad14,stroke-width:2px;\n`;
    graph += `classDef tool_result_node fill:#f6ffed,stroke:#52c41a,stroke-width:2px;\n`;
    graph += `classDef thinking_node fill:#f0f0f0,stroke:#8c8c8c,stroke-width:2px;\n`;

    // 2. Define Nodes
    const nodeDefinitions = this.nodes.map(this.getNodeDefinition).join("\n");
    graph += "\n%% Nodes\n" + nodeDefinitions + "\n\n";

    // 3. Define Edges
    const edgeDefinitions = this.edges.map(this.getEdgeDefinition).join("\n");
    graph += "\n%% Edges\n" + edgeDefinitions + "\n";

    return graph;
  }
}