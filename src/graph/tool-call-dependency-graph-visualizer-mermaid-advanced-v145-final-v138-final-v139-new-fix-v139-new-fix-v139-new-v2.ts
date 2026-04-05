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
  type: "user" | "assistant" | "tool_call" | "tool_result";
  metadata: Record<string, any>;
  content: any;
}

export interface GraphEdge {
  fromNodeId: string;
  toNodeId: string;
  dependencyType: "direct" | "conditional" | "fallback";
  metadata: Record<string, any>;
}

export class ToolCallDependencyGraphVisualizer {
  private nodes: GraphNode[];
  private edges: GraphEdge[];

  constructor(nodes: GraphNode[], edges: GraphEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private getNodeStyle(node: GraphNode): string {
    switch (node.type) {
      case "user":
        return "fill:#aaffaa,stroke:#333,stroke-width:2px";
      case "assistant":
        return "fill:#aaaaff,stroke:#333,stroke-width:2px";
      case "tool_call":
        return "fill:#ffddaa,stroke:#cc9900,stroke-width:2px";
      case "tool_result":
        return node.metadata.is_error ? "fill:#ffaaaa,stroke:#cc0000,stroke-width:2px" : "fill:#aaffff,stroke:#0099cc,stroke-width:2px";
      default:
        return "fill:#eeeeee,stroke:#333,stroke-width:1px";
    }
  }

  private getEdgeStyle(edge: GraphEdge): string {
    switch (edge.dependencyType) {
      case "direct":
        return "stroke:#006600,stroke-dasharray:none";
      case "conditional":
        return "stroke:#666600,stroke-dasharray:5 5";
      case "fallback":
        return "stroke:#cc0000,stroke-dasharray:2 2";
      default:
        return "stroke:#999999,stroke-dasharray:none";
    }
  }

  private generateMermaidNodes(nodes: GraphNode[]): string {
    const nodeDeclarations: string[] = nodes.map(node => {
      const id = node.id;
      const style = this.getNodeStyle(node);
      let contentText = "";

      if (node.type === "user") {
        contentText = `User Input: ${node.metadata.content || "N/A"}`;
      } else if (node.type === "assistant") {
        contentText = `Response: ${node.metadata.content || "N/A"}`;
      } else if (node.type === "tool_call") {
        const toolUse = node.metadata.tool_use as ToolUseBlock;
        contentText = `Tool Call: ${toolUse.name} with input: ${JSON.stringify(toolUse.input)}`;
      } else if (node.type === "tool_result") {
        const result = node.metadata.result as { content: string; is_error?: boolean };
        const status = result.is_error ? "ERROR" : "SUCCESS";
        contentText = `Tool Result (${status}): ${result.content.substring(0, 50)}...`;
      }

      return `${id}["${contentText}"]:::${node.type}Style${style}`;
    });
    return nodeDeclarations.join("\n");
  }

  private generateMermaidEdges(edges: GraphEdge[]): string {
    const edgeDeclarations: string[] = edges.map(edge => {
      const style = this.getEdgeStyle(edge);
      return `${edge.fromNodeId} -->|${edge.dependencyType}| ${edge.toNodeId}`;
    });
    return edgeDeclarations.join("\n");
  }

  public generateMermaidGraph(title: string = "Tool Call Dependency Graph"): string {
    const nodeDeclarations = this.generateMermaidNodes(this.nodes);
    const edgeDeclarations = this.generateMermaidEdges(this.edges);

    const mermaidString = `graph TD\n${nodeDeclarations}\n${edgeDeclarations}\n`;

    return `%%{init: {'theme': 'neutral', 'flowchart': {'rankDir': 'TB'}}}%%
${mermaidString}
`;
  }
}