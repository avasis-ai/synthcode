import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "../types";

export type NodeId = string;

export interface ToolCall {
  id: NodeId;
  name: string;
  input: Record<string, unknown>;
}

export interface Dependency {
  source: NodeId;
  target: NodeId;
  type: "calls" | "follows";
}

export interface DependencyGraph {
  nodes: ToolCall[];
  edges: Dependency[];
}

export type MermaidGraph = {
  mermaidSyntax: string;
};

export function visualizeDependencyGraph(graph: DependencyGraph): MermaidGraph {
  const nodesMap = new Map<NodeId, ToolCall>();
  const nodeIds = new Set<NodeId>();

  graph.nodes.forEach((node) => {
    nodesMap.set(node.id, node);
    nodeIds.add(node.id);
  });

  const edges = graph.edges.map((edge) => {
    const sourceNode = nodesMap.get(edge.source);
    const targetNode = nodesMap.get(edge.target);

    if (!sourceNode || !targetNode) {
      return null;
    }

    let relationship = "";
    if (edge.type === "calls") {
      relationship = "calls";
    } else if (edge.type === "follows") {
      relationship = "follows";
    }

    return `${sourceNode.id} -- ${relationship} --> ${targetNode.id}`;
  }).filter((s): s is string => s !== null);

  const mermaidSyntax = `graph TD;
    ${nodesMap.size > 0 ? nodesMap.keys().map(id => `${id}["${id}"]`).join('; ') : ''}
    ${edges.join('\n    ')}
`;

  return {
    mermaidSyntax: mermaidSyntax.trim(),
  };
}