import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ConditionNode {
  id: string;
  description: string;
  onTrue: string;
  onFalse: string;
}

export interface ConditionalEdge {
  fromNodeId: string;
  toNodeId: string;
  condition: string;
  label: string;
}

export interface ToolCallDependencyGraph {
  nodes: Record<string, {
    type: "start" | "tool_call" | "condition" | "end";
    id: string;
    label: string;
    details?: any;
  }>;
  edges: (
    {
      from: string;
      to: string;
      label: string;
    }
  )[];
  advancedEdges: ConditionalEdge[];
}

export class MermaidGraphVisualizer {
  private graph: ToolCallDependencyGraph;

  constructor(graph: ToolCallDependencyGraph) {
    this.graph = graph;
  }

  private generateNodeDefinition(nodeId: string, node: typeof this["graph"]["nodes"][typeof "start"] | typeof this["graph"]["nodes"][typeof "tool_call"] | typeof this["graph"]["nodes"][typeof "condition"] | typeof this["graph"]["nodes"][typeof "end"]): string {
    let definition = `    ${nodeId}["${node.label}"];`;

    if (node.type === "tool_call") {
      const toolUse = node.details as ToolUseBlock;
      definition += `\n    ${nodeId} -- Tool: ${toolUse.name} -->`;
    } else if (node.type === "condition") {
      definition += `\n    ${nodeId}["Condition: ${node.details?.description || 'Check'}"];`;
    }
    return definition;
  }

  private generateEdgeDefinition(edge: { from: string; to: string; label: string }): string {
    return `    ${edge.from} -- "${edge.label}" --> ${edge.to};`;
  }

  private generateAdvancedEdgeDefinition(edge: ConditionalEdge): string {
    return `    ${edge.fromNodeId} -- "${edge.condition}" /${edge.label}/--> ${edge.toNodeId};`;
  }

  public generateMermaidSyntax(): string {
    let mermaid = "graph TD\n";

    // 1. Define Nodes
    let nodeDefinitions: string[] = [];
    for (const nodeId in this.graph.nodes) {
      const node = this.graph.nodes[nodeId];
      nodeDefinitions.push(this.generateNodeDefinition(nodeId, node));
    }
    mermaid += nodeDefinitions.join("\n") + "\n";

    // 2. Define Standard Edges
    let standardEdges: string[] = [];
    this.graph.edges.forEach(edge => {
      standardEdges.push(this.generateEdgeDefinition(edge));
    });
    mermaid += standardEdges.join("\n") + "\n";

    // 3. Define Advanced Edges (Conditionals)
    let advancedEdges: string[] = [];
    this.graph.advancedEdges.forEach(edge => {
      advancedEdges.push(this.generateAdvancedEdgeDefinition(edge));
    });
    mermaid += advancedEdges.join("\n");

    return mermaid;
  }
}

export function visualizeToolCallDependencyGraph(graph: ToolCallDependencyGraph): string {
  const visualizer = new MermaidGraphVisualizer(graph);
  return visualizer.generateMermaidSyntax();
}