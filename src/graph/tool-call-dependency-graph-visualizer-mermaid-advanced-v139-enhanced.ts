import { Message, ContentBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface DependencyEdge {
  from: string;
  to: string;
  type: "call" | "fallback" | "conditional";
  condition?: string;
  logicId?: string;
}

interface GraphConfig {
  messages: Message[];
  edges: DependencyEdge[];
  enableConditionalRendering: boolean;
}

export class ToolCallDependencyGraphVisualizer {
  private config: GraphConfig;

  constructor(config: GraphConfig) {
    this.config = config;
  }

  private buildMermaidGraph(graphTitle: string): string {
    let mermaid = `graph TD\n`;
    mermaid += `    %% Graph Title: ${graphTitle} %% \n`;

    const nodes = new Set<string>();
    const edges: string[] = [];

    // 1. Process Messages to define initial nodes
    this.config.messages.forEach((message, index) => {
      const nodeId = `M${index}`;
      nodes.add(nodeId);
      mermaid += `    ${nodeId}["${this.formatMessageContent(message)}"]\n`;
    });

    // 2. Process Dependencies (Edges)
    this.config.edges.forEach((edge, index) => {
      const edgeId = `E${index}`;
      let linkSyntax = `${edge.from} --> ${edge.to}`;

      if (edge.type === "conditional" && this.config.enableConditionalRendering) {
        linkSyntax = `${edge.from} -- "${edge.condition}" [Logic: ${edge.logicId || 'N/A'}] --> ${edge.to}`;
      } else if (edge.type === "fallback") {
        linkSyntax = `${edge.from} -- "Fallback Path" --> ${edge.to}`;
      } else if (edge.type === "call") {
        linkSyntax = `${edge.from} --> ${edge.to} (Tool Call)`;
      }

      mermaid += `    ${linkSyntax}\n`;
    });

    return mermaid;
  }

  private formatMessageContent(message: Message): string {
    if (message.role === "user") {
      return `User Input: ${message.content.substring(0, 30)}...`;
    } else if (message.role === "assistant") {
      const content = message.content.map(block => {
        if (block.type === "text") return block.text.substring(0, 20) + "...";
        if (block.type === "tool_use") return `Tool Use: ${block.name}`;
        if (block.type === "thinking") return `Thinking: ${block.thinking.substring(0, 20)}...`;
        return "";
      }).join(" | ");
      return `Assistant Response: ${content}`;
    } else if (message.role === "tool") {
      return `Tool Result (${message.tool_use_id}): ${message.content.substring(0, 30)}...`;
    }
    return "Unknown Message";
  }

  /**
   * Generates the Mermaid syntax string for the dependency graph.
   * @param graphTitle The title to use in the graph visualization.
   * @returns The complete Mermaid graph definition string.
   */
  public generateMermaid(graphTitle: string): string {
    return this.buildMermaidGraph(graphTitle);
  }
}