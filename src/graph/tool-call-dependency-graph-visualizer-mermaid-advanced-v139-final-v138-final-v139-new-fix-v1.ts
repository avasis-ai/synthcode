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
  label: string;
  type: "start" | "process" | "tool_call" | "conditional" | "end";
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
  condition?: string;
  isLoop?: boolean;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function visualizeDependencyGraphMermaid(
  graph: DependencyGraph
): string {
  let mermaid = "graph TD\n";

  // 1. Define Nodes
  const nodeDefinitions: string[] = graph.nodes.map((node) => {
    let definition = `${node.id}["${node.label}"]`;

    if (node.type === "tool_call") {
      const toolUse = node.metadata?.tool_use as ToolUseBlock;
      if (toolUse) {
        definition = `${node.id}["Tool: ${toolUse.name} (ID: ${toolUse.id})"]`;
      }
    } else if (node.type === "conditional") {
      definition = `${node.id}["Decision Point"]`;
    } else if (node.type === "start") {
      definition = `${node.id}["Start"]`;
    } else if (node.type === "end") {
      definition = `${node.id}["End"]`;
    }

    return definition;
  });

  mermaid += nodeDefinitions.join("\n") + "\n";

  // 2. Define Edges
  const edgeDefinitions: string[] = graph.edges.map((edge) => {
    let edgeSyntax = `${edge.from} --> ${edge.to}`;

    if (edge.condition) {
      edgeSyntax += `\n    -- ${edge.condition} -->`;
    } else if (edge.isLoop) {
      edgeSyntax += `\n    -- Loop -->`;
    } else {
      edgeSyntax += `\n    -- Flow -->`;
    }

    return edgeSyntax;
  });

  mermaid += edgeDefinitions.join("\n");

  return mermaid;
}

export function createDependencyGraphVisualizer(
  graph: DependencyGraph
): string {
  return visualizeDependencyGraphMermaid(graph);
}