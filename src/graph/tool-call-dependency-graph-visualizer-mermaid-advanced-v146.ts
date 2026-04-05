import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface DependencyNode {
  id: string;
  type: "start" | "process" | "tool_call" | "conditional_branch" | "end";
  label: string;
  details?: Record<string, any>;
}

interface DependencyEdge {
  fromId: string;
  toId: string;
  condition?: string;
  label?: string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV146 {
  private graphContext: {
    messages: Message[];
    dependencies: DependencyNode[];
    edges: DependencyEdge[];
  };

  constructor(graphContext: {
    messages: Message[];
    dependencies: DependencyNode[];
    edges: DependencyEdge[];
  }) {
    this.graphContext = graphContext;
  }

  private generateNodeDefinition(node: DependencyNode): string {
    let nodeDefinition = "";
    switch (node.type) {
      case "start":
        nodeDefinition = `A[Start]\n`;
        break;
      case "process":
        nodeDefinition = `B{Process: ${node.label}}\n`;
        break;
      case "tool_call":
        const toolUse = node.details?.tool_use as ToolUseBlock;
        if (toolUse) {
          nodeDefinition = `C[[Tool: ${toolUse.name} (${toolUse.id})]]\n`;
        } else {
          nodeDefinition = `C[Tool Call: ${node.label}]\n`;
        }
        break;
      case "conditional_branch":
        nodeDefinition = `D{Condition: ${node.label}}\n`;
        break;
      case "end":
        nodeDefinition = `E([End])\n`;
        break;
      default:
        nodeDefinition = `?(${node.label})\n`;
    }
    return `${node.id}: ${nodeDefinition}`;
  }

  private generateEdgeDefinition(edge: DependencyEdge): string {
    let edgeDefinition = "";
    let link = "";

    if (edge.condition) {
      link = `-->|${edge.condition}|`;
    } else if (edge.label) {
      link = `-->|${edge.label}|`;
    } else {
      link = "-->";
    }

    edgeDefinition = `${edge.fromId} ${link} ${edge.toId}\n`;
    return edgeDefinition;
  }

  public generateMermaidCode(): string {
    let mermaidCode = "graph TD\n";

    // 1. Define Nodes
    const nodeDefinitions = this.graphContext.dependencies.map(this.generateNodeDefinition).join('\n');
    mermaidCode += `%% Nodes Definition\n${nodeDefinitions}\n\n`;

    // 2. Define Edges
    const edgeDefinitions = this.graphContext.edges.map(this.generateEdgeDefinition).join('\n');
    mermaidCode += `%% Edges Definition\n${edgeDefinitions}\n`;

    return mermaidCode;
  }
}