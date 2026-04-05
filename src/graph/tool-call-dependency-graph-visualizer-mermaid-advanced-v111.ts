import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ConditionalEdge = {
  source: string;
  target: string;
  condition: string;
};

export interface ToolCallDependencyGraph {
  messages: Message[];
  edges: ConditionalEdge[];
}

export class ToolCallDependencyGraphVisualizer {
  private graph: ToolCallDependencyGraph;

  constructor(graph: ToolCallDependencyGraph) {
    this.graph = graph;
  }

  private getNodeLabel(message: Message): string {
    if (message.role === "user") {
      return `User: "${message.content.substring(0, 20)}..."`;
    }
    if (message.role === "assistant") {
      const toolUses = (message.content as ContentBlock[]).filter(block => block.type === "tool_use");
      if (toolUses.length > 0) {
        return `Assistant (Tools: ${toolUses.length})`;
      }
      return `Assistant: "${message.content.substring(0, 20)}..."`;
    }
    if (message.role === "tool") {
      return `Tool Result (${message.tool_use_id})`;
    }
    return "Unknown Message";
  }

  private generateMermaidGraph(): string {
    let mermaidCode = "graph TD\n";

    // 1. Define Nodes (Messages)
    const nodes: Map<string, string> = new Map();
    this.graph.messages.forEach((message, index) => {
      const nodeId = `M${index}`;
      const label = this.getNodeLabel(message);
      mermaidCode += `  ${nodeId}["${label}"]\n`;
      nodes.set(nodeId, label);
    });

    // 2. Define Edges (Dependencies)
    this.graph.edges.forEach((edge, index) => {
      const sourceNode = `M${this.graph.messages.findIndex(m => this.getNodeLabel(m).includes(edge.source.split(":")[1] || ""))}`;
      const targetNode = `M${this.graph.messages.findIndex(m => this.getNodeLabel(m).includes(edge.target.split(":")[1] || ""))}`;

      if (sourceNode && targetNode) {
        let edgeSyntax = `  ${sourceNode} -- "${edge.condition}" --> ${targetNode};\n`;
        if (edge.condition.toLowerCase().includes("conditional")) {
          edgeSyntax = `  ${sourceNode} -- "IF ${edge.condition}" --> ${targetNode}:::conditional_branch;\n`;
        }
        mermaidCode += edgeSyntax;
      }
    });

    // 3. Define Styles for new types
    mermaidCode += "\nclassDef conditional_branch fill:#ffdddd,stroke:#f00,stroke-width:2px;";

    return mermaidCode;
  }

  public visualizeMermaid(): string {
    return this.generateMermaidGraph();
  }
}