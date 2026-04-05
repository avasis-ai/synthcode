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
  label: string;
  type: "user" | "assistant" | "tool";
  metadata: Record<string, any>;
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
  condition?: string;
}

interface GraphContext {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

class ToolCallDependencyGraphVisualizer {
  private context: GraphContext;

  constructor(context: GraphContext) {
    this.context = context;
  }

  private generateNodeDefinition(node: GraphNode): string {
    const id = node.id;
    let label = node.label;

    if (node.type === "user") {
      label = `User: ${node.label.substring(0, 30)}...`;
    } else if (node.type === "assistant") {
      label = `Assistant: ${node.label.substring(0, 30)}...`;
    } else if (node.type === "tool") {
      label = `Tool Result (${node.metadata.toolName || 'Unknown'}): ${node.label.substring(0, 30)}...`;
    }

    return `${id}["${label}"]`;
  }

  private generateEdgeDefinition(edge: GraphEdge): string {
    let definition = `${edge.from} --> ${edge.to}`;

    if (edge.condition) {
      definition += `\n    -- ${edge.condition} -->`;
    } else {
      definition += `\n    -- Flow -->`;
    }
    return definition;
  }

  public generateMermaidSyntax(): string {
    let mermaid = "graph TD\n";

    // 1. Define Nodes
    const nodeDefinitions = this.context.nodes.map(this.generateNodeDefinition).join("\n    ");
    mermaid += `    ${nodeDefinitions}\n\n`;

    // 2. Define Edges
    const edgeDefinitions = this.context.edges.map(this.generateEdgeDefinition).join("\n");
    mermaid += `    ${edgeDefinitions}\n`;

    return mermaid;
  }
}

export function visualizeToolCallDependencyGraph(context: GraphContext): string {
  const visualizer = new ToolCallDependencyGraphVisualizer(context);
  return visualizer.generateMermaidSyntax();
}