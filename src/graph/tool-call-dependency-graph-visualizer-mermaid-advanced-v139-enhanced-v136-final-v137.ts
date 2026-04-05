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
  message: Message;
  dependencies: {
    targetId: string;
    type: "call" | "conditional" | "loop";
    condition?: string;
    loop?: "while" | "for";
  }[];
  metadata?: {
    condition?: string;
    loop?: "while" | "for";
  };
}

interface DependencyEdge {
  sourceId: string;
  targetId: string;
  type: "call" | "conditional" | "loop";
  condition?: string;
  loop?: "while" | "for";
}

export class ToolCallDependencyGraphVisualizer {
  private nodes: GraphNode[];
  private edges: DependencyEdge[];

  constructor(nodes: GraphNode[], edges: DependencyEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private generateNodeId(node: GraphNode): string {
    return node.id;
  }

  private generateMermaidNodeDefinition(node: GraphNode): string {
    const id = this.generateNodeId(node);
    let content = "";

    if (node.message.role === "user") {
      content = `User Input: "${(node.message as UserMessage).content.substring(0, 30)}..."`;
    } else if (node.message.role === "assistant") {
      const assistantMsg = node.message as AssistantMessage;
      const textBlocks = (assistantMsg.content as ContentBlock[]).filter(
        (block) => (block as TextBlock).type === "text"
      );
      if (textBlocks.length > 0) {
        content = `Assistant Response: ${textBlocks.map(b => (b as TextBlock).text).join(" ")}...`;
      } else {
        content = "Assistant Response (Complex)";
      }
    } else if (node.message.role === "tool") {
      const toolResult = node.message as ToolResultMessage;
      const errorStatus = toolResult.is_error ? "ERROR" : "SUCCESS";
      content = `Tool Result (${toolResult.tool_use_id}): ${errorStatus} - ${toolResult.content.substring(0, 30)}...`;
    }

    return `${id}["${content}"]`;
  }

  private generateMermaidEdgeDefinition(edge: DependencyEdge): string {
    const sourceId = this.generateNodeId(this.nodes.find((n) => n.id === edge.sourceId) || { id: "" } as GraphNode);
    const targetId = this.generateNodeId(this.nodes.find((n) => n.id === edge.targetId) || { id: "" } as GraphNode);

    let edgeSyntax = "";
    let label = "";

    if (edge.type === "call") {
      label = "Calls";
      edgeSyntax = `${sourceId} -->|${label}| ${targetId}`;
    } else if (edge.type === "conditional") {
      const condition = edge.condition || "Condition Met";
      label = `if ${condition}`;
      edgeSyntax = `${sourceId} -- ${label} --> ${targetId}`;
    } else if (edge.type === "loop") {
      const loopType = edge.loop === "while" ? "While Loop" : "For Loop";
      label = `${loopType}`;
      edgeSyntax = `${sourceId} -- ${label} --> ${targetId}`;
    }

    return edgeSyntax;
  }

  public renderMermaidGraph(): string {
    let nodeDefinitions = this.nodes.map(this.generateMermaidNodeDefinition).join("\n");
    let edgeDefinitions = this.edges.map(this.generateMermaidEdgeDefinition).join("\n");

    const mermaidSyntax = `graph TD\n${nodeDefinitions}\n\n${edgeDefinitions}`;
    return mermaidSyntax;
  }
}