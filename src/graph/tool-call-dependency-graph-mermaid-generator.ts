import { Message, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface GraphNode {
  id: string;
  label: string;
  type: "tool" | "user" | "assistant";
  details: Record<string, unknown>;
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
  condition?: string;
}

export interface ToolCallDependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class ToolCallDependencyGraphMermaidGenerator {
  private graph: ToolCallDependencyGraph;

  constructor(graph: ToolCallDependencyGraph) {
    this.graph = graph;
  }

  private generateNodeDefinition(node: GraphNode): string {
    let definition = `${node.id}["${node.label}"]`;
    if (node.type === "tool") {
      const toolDetails = node.details as { name: string; input: Record<string, unknown> };
      definition += `\n  -- Tool: ${toolDetails.name} --\n  Input: ${JSON.stringify(toolDetails.input)}`;
    } else if (node.type === "user") {
      definition += `\n  -- User Input --`;
    } else if (node.type === "assistant") {
      definition += `\n  -- Assistant Response --`;
    }
    return definition;
  }

  private generateEdgeDefinition(edge: GraphEdge): string {
    let definition = `${edge.from} --> ${edge.to}`;
    if (edge.condition) {
      definition += `{${edge.condition}}`;
    } else {
      definition += ``;
    }
    return definition;
  }

  public generateMermaidString(): string {
    let mermaid = "graph TD\n";

    // 1. Define all nodes
    for (const node of this.graph.nodes) {
      mermaid += this.generateNodeDefinition(node) + "\n";
    }

    // 2. Define all edges
    for (const edge of this.graph.edges) {
      mermaid += this.generateEdgeDefinition(edge) + "\n";
    }

    return mermaid.trim();
  }
}

export function generateGraphMermaid(graph: ToolCallDependencyGraph): string {
  const generator = new ToolCallDependencyGraphMermaidGenerator(graph);
  return generator.generateMermaidString();
}