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

interface DependencyEdge {
  from: string;
  to: string;
  type: "call" | "response" | "conditional" | "fallback";
  label?: string;
}

interface DependencyGraph {
  messages: Message[];
  dependencies: DependencyEdge[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV109 {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private getNodeMermaidSyntax(message: Message, index: number): string {
    const id = `msg${index}`;
    let label = "";

    if (message.role === "user") {
      label = `User Input`;
    } else if (message.role === "assistant") {
      label = `Assistant Turn`;
    } else if (message.role === "tool") {
      const toolResult = message as ToolResultMessage;
      const status = toolResult.is_error ? "Error" : "Success";
      label = `Tool Result (${toolResult.tool_use_id}): ${status}`;
    }

    return `${id}["${label}"]`;
  }

  private getEdgeMermaidSyntax(edge: DependencyEdge): string {
    let edgeSyntax = "";
    let style = "";

    switch (edge.type) {
      case "call":
        edgeSyntax = "-->";
        style = "style fill:#ccf,stroke:#333,stroke-width:2px";
        break;
      case "response":
        edgeSyntax = "-->";
        style = "style fill:#cfc,stroke:#333,stroke-width:2px";
        break;
      case "conditional":
        edgeSyntax = "-->|${edge.label || 'Condition'}|";
        style = "style fill:#ffc,stroke:#f90,stroke-width:2px,stroke-dasharray: 5 5";
        break;
      case "fallback":
        edgeSyntax = "-->|${edge.label || 'Fallback'}|";
        style = "style fill:#fcc,stroke:#c00,stroke-width:2px,stroke-dasharray: 5 5";
        break;
    }

    return `${edgeSyntax} ${style}`;
  }

  private generateNodesMermaid(messages: Message[]): string {
    return messages.map((msg, index) => this.getNodeMermaidSyntax(msg, index)).join("\n");
  }

  private generateEdgesMermaid(dependencies: DependencyEdge[]): string {
    return dependencies.map(edge => {
      const fromNode = `msg${this.graph.messages.findIndex(m => m === this.graph.messages.find(m2 => m2.role === 'assistant' && m2.content.length > 0 && m2.content[0].type === 'tool_use' && m2.content[0].id === edge.from.split('msg')[1] || m2.role === 'user' && m2.content.length > 0 && m2.content[0].type === 'text' ? 'msg' : 'msg0')}:`;
      const toNode = `msg${this.graph.messages.findIndex(m => m.role === 'tool' && m.tool_use_id === edge.to.split('msg')[1] ? 'msg' : 'msg0')}:`;

      // Simplified node resolution for demonstration, assuming direct index mapping for simplicity
      const fromIndex = this.graph.messages.findIndex((_, i) => i === 0); // Placeholder logic
      const toIndex = this.graph.messages.findIndex((_, i) => i === 1); // Placeholder logic

      const fromId = `msg${Math.min(this.graph.messages.length - 1, 1)}`;
      const toId = `msg${Math.min(this.graph.messages.length - 1, 2)}`;

      return `${fromId} ${this.getEdgeMermaidSyntax(edge)} ${toId}`;
    }).join("\n");
  }

  public renderMermaidSyntax(): string {
    const nodes = this.generateNodesMermaid(this.graph.messages);
    const edges = this.generateEdgesMermaid(this.graph.dependencies);

    return `graph TD\n${nodes}\n\n${edges}`;
  }
}

export function visualizeToolCallDependencyGraphMermaidAdvancedV109(graph: DependencyGraph): string {
  const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV109(graph);
  return visualizer.renderMermaidSyntax();
}