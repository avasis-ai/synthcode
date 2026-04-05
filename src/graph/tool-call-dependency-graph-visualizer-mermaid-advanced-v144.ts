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

interface GraphNode {
  id: string;
  type: "user" | "assistant" | "tool";
  content: any;
  metadata: Record<string, unknown>;
}

interface GraphEdge {
  from: string;
  to: string;
  type: "call" | "response" | "dependency";
  metadata: Record<string, unknown>;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV144 {
  private nodes: GraphNode[];
  private edges: GraphEdge[];

  constructor(nodes: GraphNode[], edges: GraphEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private getNodeMermaidId(node: GraphNode): string {
    const baseId = node.id.replace(/[^a-zA-Z0-9]/g, "_");
    if (node.type === "user") return `User_${baseId}`;
    if (node.type === "assistant") return `Assistant_${baseId}`;
    if (node.type === "tool") return `Tool_${baseId}`;
    return `Node_${baseId}`;
  }

  private getNodeMermaidDefinition(node: GraphNode): string {
    const id = this.getNodeMermaidId(node);
    let contentString: string = "";

    if (node.type === "user") {
      const userMsg = node.content as UserMessage;
      contentString = `User Message: "${userMsg.content.substring(0, 50)}..."`;
    } else if (node.type === "assistant") {
      const assistantMsg = node.content as AssistantMessage;
      const textBlocks = (assistantMsg.content as ContentBlock[]).filter(
        (block) => (block as TextBlock).type === "text"
      );
      if (textBlocks.length > 0) {
        contentString = `Assistant Response: "${textBlocks[0].text.substring(0, 50)}..."`;
      } else {
        contentString = "Assistant Response (Complex)";
      }
    } else if (node.type === "tool") {
      const toolRes = node.content as ToolResultMessage;
      const status = toolRes.is_error ? "ERROR" : "SUCCESS";
      contentString = `Tool Result (${status}): ${toolRes.content.substring(0, 50)}...`;
    }

    return `${id}["${contentString}"]`;
  }

  private getEdgeMermaidDefinition(edge: GraphEdge): string {
    const fromId = this.getNodeMermaidId(this.nodes.find((n) => n.id === edge.from) || {
      id: edge.from,
      type: "unknown",
      content: {} as any,
      metadata: {}
    } as GraphNode);
    const toId = this.getNodeMermaidId(this.nodes.find((n) => n.id === edge.to) || {
      id: edge.to,
      type: "unknown",
      content: {} as any,
      metadata: {}
    } as GraphNode);

    let label = "";
    switch (edge.type) {
      case "call":
        label = "Calls";
        break;
      case "response":
        label = "Responds To";
        break;
      case "dependency":
        label = "Depends On";
        break;
    }

    return `${fromId} -- ${label} --> ${toId}`;
  }

  public generateMermaidGraph(): string {
    let mermaidCode = "graph TD;\n";

    // 1. Define Nodes
    const nodeDefinitions = this.nodes.map(this.getNodeMermaidDefinition).join("\n    ");
    mermaidCode += `    ${nodeDefinitions}\n\n`;

    // 2. Define Edges
    const edgeDefinitions = this.edges.map(this.getEdgeMermaidDefinition).join("\n");
    mermaidCode += `${edgeDefinitions}\n`;

    return mermaidCode;
  }
}