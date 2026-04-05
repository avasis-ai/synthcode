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

export type DependencyGraphNode = {
  id: string;
  type: "start" | "user" | "assistant" | "tool_result" | "decision";
  label: string;
  content?: string;
  metadata?: Record<string, any>;
};

export type DependencyGraphEdge = {
  from: string;
  to: string;
  label: string;
  condition?: string;
  is_loop?: boolean;
};

export interface ToolCallDependencyGraph {
  nodes: DependencyGraphNode[];
  edges: DependencyGraphEdge[];
}

export type GraphContext = {
  messages: Message[];
  graph: ToolCallDependencyGraph;
};

export function visualizeToolCallDependencyGraph(context: GraphContext): string {
  const { graph } = context;
  let mermaidNodes: string[] = [];
  let mermaidEdges: string[] = [];

  const nodeMap: Map<string, DependencyGraphNode> = new Map(
    graph.nodes.map((node) => [node.id, node])
  );

  const getNodeDefinition = (node: DependencyGraphNode): string => {
    let content = "";
    switch (node.type) {
      case "start":
        content = "Start";
        break;
      case "user":
        content = `User Input: ${node.label}`;
        break;
      case "assistant":
        content = `Assistant Action: ${node.label}`;
        break;
      case "tool_result":
        content = `Tool Result: ${node.label}`;
        break;
      case "decision":
        content = `Decision Point: ${node.label}`;
        break;
    }
    return `    ${node.id}["${content}"]`;
  };

  for (const node of graph.nodes) {
    mermaidNodes.push(getNodeDefinition(node));
  }

  const getEdgeDefinition = (edge: DependencyGraphEdge): string => {
    let edgeStr = `${edge.from} --> ${edge.to}`;
    let labelStr = `("${edge.label}")`;

    if (edge.condition) {
      labelStr = `("${edge.label}" --> ${edge.condition})`;
    }

    if (edge.is_loop) {
      edgeStr = `${edge.from} -- Loop --> ${edge.to}`;
    }

    return `${edgeStr} ${labelStr}`;
  };

  for (const edge of graph.edges) {
    mermaidEdges.push(getEdgeDefinition(edge));
  }

  const mermaidGraph = `graph TD\n${mermaidNodes.join('\n')}\n\n${mermaidEdges.join('\n')}`;

  return mermaidGraph;
}