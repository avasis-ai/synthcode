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

export interface GraphNode {
  id: string;
  label: string;
  type: "user" | "assistant" | "tool";
  details: Record<string, any>;
}

export interface GraphEdge {
  fromId: string;
  toId: string;
  description: string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV23 {
  private nodes: GraphNode[];
  private edges: GraphEdge[];

  constructor(nodes: GraphNode[], edges: GraphEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private getNodeDefinition(node: GraphNode): string {
    let details = "";
    if (node.type === "user") {
      details = `User Input: ${node.details.content.substring(0, 30)}...`;
    } else if (node.type === "assistant") {
      details = `Response: ${node.details.content.substring(0, 30)}...`;
    } else if (node.type === "tool") {
      details = `Tool Result (${node.details.tool_use_id}): ${node.details.content.substring(0, 30)}...`;
    }
    return `    ${node.id}["${node.label}\\n(${node.type})\\n${details}"]`;
  }

  private getEdgeDefinition(edge: GraphEdge): string {
    return `    ${edge.fromId} -->|${edge.description}| ${edge.toId};`;
  }

  public renderMermaidSyntax(): string {
    let mermaid = "graph TD;\n";
    mermaid += "%% Tool Call Dependency Graph (Advanced v23)\n";

    if (this.nodes.length === 0) {
      return "graph TD;\n%% No nodes provided.";
    }

    const nodeDefinitions = this.nodes.map(this.getNodeDefinition).join("\n");
    mermaid += "\n%% Nodes\n" + nodeDefinitions + "\n";

    if (this.edges.length === 0) {
      return mermaid + "\n%% No edges provided.";
    }

    const edgeDefinitions = this.edges.map(this.getEdgeDefinition).join("\n");
    mermaid += "\n%% Edges\n" + edgeDefinitions;

    return mermaid;
  }

  public renderGraph(): string {
    const mermaidSyntax = this.renderMermaidSyntax();
    return `\`\`\`mermaid\n${mermaidSyntax}\n\`\`\``;
  }
}