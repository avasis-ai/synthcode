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
  type: "user" | "assistant" | "tool";
  content: any;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  fromId: string;
  toId: string;
  condition?: string;
  fallback?: string;
}

export class ToolCallDependencyGraphVisualizer {
  private nodes: GraphNode[];
  private edges: GraphEdge[];

  constructor(nodes: GraphNode[], edges: GraphEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private getNodeLabel(node: GraphNode): string {
    if (node.type === "user") {
      const userMsg = node.content as UserMessage;
      return `User: ${userMsg.content.substring(0, 30)}...`;
    }
    if (node.type === "assistant") {
      const assistantMsg = node.content as AssistantMessage;
      const textBlocks = (assistantMsg.content as ContentBlock[]).filter(
        (block) => (block as TextBlock).type === "text"
      );
      const textContent = textBlocks.map((block) => (block as TextBlock).text).join(
        " "
      ).substring(0, 30);
      return `Assistant: ${textContent}...`;
    }
    if (node.type === "tool") {
      const toolResult = node.content as ToolResultMessage;
      const errorStatus = toolResult.is_error ? " (ERROR)" : "";
      return `Tool Result (${toolResult.tool_use_id}): ${toolResult.content.substring(0, 30)}${errorStatus}...`;
    }
    return `Node ${node.id}`;
  }

  private generateMermaidGraph(): string {
    let mermaid = "graph TD\n";

    // 1. Define Nodes
    this.nodes.forEach((node, index) => {
      const id = `N${index}`;
      const label = this.getNodeLabel(node);
      mermaid += `${id}["${label}"]\n`;
    });

    // 2. Define Edges with advanced flow control
    this.edges.forEach((edge, index) => {
      const fromId = `N${this.nodes.findIndex((n) => n.id === edge.fromId)}`;
      const toId = `N${this.nodes.findIndex((n) => n.id === edge.toId)}`;

      if (fromId === undefined || toId === undefined) {
        return;
      }

      let edgeSyntax = `${fromId} --> ${toId}`;

      if (edge.condition) {
        // Simulate 'if' branching using subgraph or explicit labels
        mermaid += `\nsubgraph Flow_Condition_${index}\n`;
        mermaid += `${fromId} -- IF ${edge.condition} --> ${toId} (Success Path)\n`;
        if (edge.fallback) {
          mermaid += `${fromId} -- ELSE/FALLBACK --> N_Fallback_${index}\n`;
          mermaid += `N_Fallback_${index}["Fallback Path for ${edge.fromId} to ${edge.toId}"]\n`;
          mermaid += `N_Fallback_${index} --> ${toId}\n`;
        } else {
          mermaid += `${fromId} -- ${edge.condition} --> ${toId}\n`;
        }
        mermaid += `end\n`;
      } else {
        mermaid += `${edgeSyntax}\n`;
      }
    });

    return mermaid;
  }

  public renderMermaidString(): string {
    return this.generateMermaidGraph();
  }
}