import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface GraphNode {
  id: string;
  type: "start" | "tool_call" | "conditional" | "loop" | "end";
  label: string;
  details: Record<string, any>;
}

export interface GraphEdge {
  fromId: string;
  toId: string;
  condition?: string;
  label?: string;
}

export interface GraphContext {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class ToolCallDependencyGraphVisualizer {
  private context: GraphContext;

  constructor(context: GraphContext) {
    this.context = context;
  }

  private generateNodeMermaid(node: GraphNode): string {
    switch (node.type) {
      case "start":
        return `    ${node.id}["Start: ${node.label}"]`;
      case "tool_call":
        const tool = node.details.toolName || "Unknown Tool";
        const input = JSON.stringify(node.details.input || {});
        return `    ${node.id}["Tool Call: ${tool}\\nInput: ${input}"]`;
      case "conditional":
        return `    ${node.id}["Decision Point: ${node.label}"]`;
      case "loop":
        return `    ${node.id}["Loop Start: ${node.label}"]`;
      case "end":
        return `    ${node.id}["End"]`;
      default:
        return `    ${node.id}["Unknown Node"]`;
    }
  }

  private generateEdgeMermaid(edge: GraphEdge): string {
    let mermaid = `    ${edge.fromId} --> ${edge.toId}`;
    if (edge.condition) {
      mermaid += `{${edge.condition}}`;
    } else if (edge.label) {
      mermaid += `("${edge.label}")`;
    }
    return mermaid;
  }

  private generateMermaidGraph(context: GraphContext): string {
    let mermaid = "graph TD\n";
    mermaid += "%% Tool Call Dependency Graph\n";

    context.nodes.forEach(node => {
      mermaid += this.generateNodeMermaid(node) + "\n";
    });

    context.edges.forEach(edge => {
      mermaid += this.generateEdgeMermaid(edge) + "\n";
    });

    return mermaid;
  }

  private validateMermaidSyntax(mermaidString: string): boolean {
    const requiredKeywords = ["graph TD", "-->", "{", "}"];
    for (const keyword of requiredKeywords) {
      if (!mermaidString.includes(keyword)) {
        return false;
      }
    }
    return true;
  }

  public visualize(): { mermaidSyntax: string; isValid: boolean } {
    const mermaidSyntax = this.generateMermaidGraph(this.context);
    const isValid = this.validateMermaidSyntax(mermaidSyntax);
    return { mermaidSyntax, isValid };
  }
}

export function createGraphVisualizer(context: GraphContext): ToolCallDependencyGraphVisualizer {
  return new ToolCallDependencyGraphVisualizer(context);
}