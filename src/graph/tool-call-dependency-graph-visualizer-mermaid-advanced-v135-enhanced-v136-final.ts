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

export interface DependencyEdge {
  fromNodeId: string;
  toNodeId: string;
  type: "call" | "conditional" | "loop";
  condition?: string;
  loopCondition?: string;
}

export interface GraphNode {
  id: string;
  type: "user" | "assistant" | "tool_result" | "start" | "end";
  content: string;
  metadata?: Record<string, any>;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: DependencyEdge[];
}

export class ToolCallDependencyGraphVisualizer {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private getNodeMermaidId(node: GraphNode): string {
    return node.id.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 10);
  }

  private getEdgeMermaidSyntax(edge: DependencyEdge): string {
    let syntax = "";
    let label = "";

    switch (edge.type) {
      case "call":
        label = "Calls";
        break;
      case "conditional":
        label = `[${edge.condition || "Condition"}]`;
        syntax = `-->|${label}|`;
        break;
      case "loop":
        label = `Loop (${edge.loopCondition || "Loop"})`;
        syntax = `-->|${label}|`;
        break;
    }
    return `${edge.fromNodeId} ${syntax} ${edge.toNodeId}`;
  }

  private getNodeMermaidSyntax(node: GraphNode): string {
    let shape = "rectangle";
    let content = node.content.replace(/[\r\n]/g, " ").trim();

    switch (node.type) {
      case "user":
        shape = "user";
        break;
      case "assistant":
        shape = "assistant";
        break;
      case "tool_result":
        shape = "tool_result";
        break;
      case "start":
        shape = "circle";
        content = "Start";
        break;
      case "end":
        shape = "circle";
        content = "End";
        break;
    }

    return `${this.getNodeMermaidId(node)}[${content}]`;
  }

  public generateMermaidGraph(): string {
    let mermaid = "graph TD;\n";

    // 1. Define Nodes
    const nodeDefinitions = this.graph.nodes.map(node => this.getNodeMermaidSyntax(node)).join("\n    ");
    mermaid += `    ${nodeDefinitions};\n\n`;

    // 2. Define Edges
    const edgeDefinitions = this.graph.edges.map(edge => this.getEdgeMermaidSyntax(edge)).join("\n    ");
    mermaid += `    ${edgeDefinitions};\n`;

    // 3. Add Styling (Optional but good practice for advanced visualization)
    mermaid += `\n%% Styling for enhanced visualization\n`;
    mermaid += `classDef user fill:#e6f7ff,stroke:#91d5ff,stroke-width:2px; class .${this.getNodeMermaidId(this.graph.nodes.find(n => n.type === 'user') || { id: 'dummy' } as GraphNode)} user;\n`;
    mermaid += `classDef assistant fill:#fff1e6,stroke:#ffcc80,stroke-width:2px; class .${this.getNodeMermaidId(this.graph.nodes.find(n => n.type === 'assistant') || { id: 'dummy' } as GraphNode)} assistant;\n`;
    mermaid += `classDef tool_result fill:#f6ffed,stroke:#b7eb8f,stroke-width:2px; class .${this.getNodeMermaidId(this.graph.nodes.find(n => n.type === 'tool_result') || { id: 'dummy' } as GraphNode)} tool_result;\n`;

    return mermaid.trim();
  }
}