import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface AdvancedNode {
  id: string;
  type: "message" | "tool_call" | "tool_result";
  content: string;
  style?: {
    fill?: string;
    stroke?: string;
    fontSize?: string;
  };
}

export interface AdvancedEdge {
  fromId: string;
  toId: string;
  label: string;
  weight?: number;
}

export interface ToolCallDependencyGraph {
  nodes: AdvancedNode[];
  edges: AdvancedEdge[];
}

export class ToolCallDependencyGraphVisualizer {
  private readonly mermaidGraphType: string = "graph TD";

  private getNodeMermaidId(node: AdvancedNode): string {
    return node.id;
  }

  private getNodeMermaidDefinition(node: AdvancedNode): string {
    let definition = `${this.getNodeMermaidId(node)}[\n`;
    let content = "";

    if (node.type === "message") {
      content = `Message: ${node.content}`;
    } else if (node.type === "tool_call") {
      content = `Tool Call: ${node.content}`;
    } else if (node.type === "tool_result") {
      content = `Tool Result: ${node.content}`;
    }

    definition += `${content}\n]`;

    if (node.style) {
      definition += ` style ${node.id} fill:${node.style.fill || 'lightblue'} stroke:${node.style.stroke || 'blue'} ${node.style.fontSize ? `font-size:${node.style.fontSize}` : ''};\n`;
    } else {
      definition += ` style ${node.id} fill:lightblue stroke:blue;\n`;
    }

    return definition;
  }

  private getEdgeMermaidDefinition(edge: AdvancedEdge): string {
    let link = `${this.getNodeMermaidId(edge.fromId)} -->|${edge.label}| ${this.getNodeMermaidId(edge.toId)}`;
    if (edge.weight !== undefined) {
      link += ` (Weight: ${edge.weight})`;
    }
    return link;
  }

  public renderMermaidCode(graph: ToolCallDependencyGraph): string {
    let mermaidCode = `%% Mermaid Graph for Tool Call Dependency\n`;
    mermaidCode += `%% Version: v17 Advanced\n`;
    mermaidCode += `%% Graph Type: ${this.mermaidGraphType}\n\n`;

    let nodeDefinitions = graph.nodes.map(this.getNodeMermaidDefinition).join('\n');
    mermaidCode += nodeDefinitions + "\n\n";

    let edgeDefinitions = graph.edges.map(this.getEdgeMermaidDefinition).join('\n');
    mermaidCode += edgeDefinitions + "\n";

    return `\`\`\`mermaid\n${mermaidCode}\n\`\`\``;
  }
}