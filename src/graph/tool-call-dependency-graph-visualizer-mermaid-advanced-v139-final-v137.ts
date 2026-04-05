import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type GraphNode = {
  id: string;
  type: "user" | "assistant" | "tool";
  content: string;
  metadata?: Record<string, any>;
};

export type GraphEdge = {
  fromId: string;
  toId: string;
  type: "sequence" | "conditional" | "loop";
  condition?: string;
  label?: string;
};

export type DependencyGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export class ToolCallDependencyGraphVisualizer {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private generateMermaidGraphDefinition(graph: DependencyGraph): string {
    let mermaid = "graph TD;\n";

    // 1. Define Nodes
    const nodeDefinitions: string[] = graph.nodes.map(node => {
      let contentDisplay = "";
      switch (node.type) {
        case "user":
          contentDisplay = `User Input: "${node.content.substring(0, 30)}..."`;
          break;
        case "assistant":
          contentDisplay = `Assistant Response: "${node.content.substring(0, 30)}..."`;
          break;
        case "tool":
          contentDisplay = `Tool Call: ${node.metadata?.toolName || "Unknown"}`;
          break;
      }
      return `${node.id}["${contentDisplay}"]`;
    });
    mermaid += nodeDefinitions.join('\n') + "\n";

    // 2. Define Edges (Flow)
    const edgeDefinitions: string[] = graph.edges.map(edge => {
      let edgeSyntax = "";
      let label = edge.label ? ` -- ${edge.label} -->` : "";

      if (edge.type === "conditional") {
        edgeSyntax = `${edge.fromId} -- ${edge.condition || "Condition"} --> ${edge.toId}`;
      } else if (edge.type === "loop") {
        edgeSyntax = `${edge.fromId} -- Loop Start --> ${edge.toId}`;
      } else {
        edgeSyntax = `${edge.fromId} --> ${edge.toId}`;
      }
      return edgeSyntax;
    });
    mermaid += edgeDefinitions.join('\n');

    return mermaid;
  }

  public generateMermaidSyntax(): string {
    return this.generateMermaidGraphDefinition(this.graph);
  }

  public generateAdvancedMermaidSyntax(): string {
    let mermaid = "graph TD;\n";

    // 1. Define Nodes (Same as before)
    const nodeDefinitions: string[] = this.graph.nodes.map(node => {
      let contentDisplay = "";
      switch (node.type) {
        case "user":
          contentDisplay = `User Input: "${node.content.substring(0, 30)}..."`;
          break;
        case "assistant":
          contentDisplay = `Assistant Response: "${node.content.substring(0, 30)}..."`;
          break;
        case "tool":
          contentDisplay = `Tool Call: ${node.metadata?.toolName || "Unknown"}`;
          break;
      }
      return `${node.id}["${contentDisplay}"]`;
    });
    mermaid += nodeDefinitions.join('\n') + "\n";

    // 2. Define Edges (Handling advanced flow control)
    const edgeDefinitions: string[] = this.graph.edges.map(edge => {
      let edgeSyntax = "";
      let label = edge.label ? ` -- ${edge.label} -->` : "";

      if (edge.type === "conditional") {
        // Use specific syntax for conditional branches
        edgeSyntax = `${edge.fromId} -- ${edge.condition || "Condition"} --> ${edge.toId}`;
      } else if (edge.type === "loop") {
        // Representing loop entry/exit points
        edgeSyntax = `${edge.fromId} -- Loop Entry --> ${edge.toId}`;
      } else {
        // Standard sequence flow
        edgeSyntax = `${edge.fromId} --> ${edge.toId}`;
      }
      return edgeSyntax;
    });
    mermaid += edgeDefinitions.join('\n');

    return mermaid;
  }
}