import { Message, ToolUseBlock } from "./types";

export interface ToolCallNode {
  id: string;
  name: string;
  description: string;
}

export interface DependencyEdge {
  fromNodeId: string;
  toNodeId: string;
  label: string;
}

export type GraphStructure = {
  nodes: ToolCallNode[];
  edges: DependencyEdge[];
};

export function renderMermaidSimpleGraph(structure: GraphStructure): string {
  let mermaidString = "graph TD\n";

  const nodeDefinitions = structure.nodes.map(node => {
    return `${node.id}["${node.name}\\n(${node.description})"]`;
  }).join('\n');

  mermaidString += `${nodeDefinitions}\n`;

  const edgeDefinitions = structure.edges.map(edge => {
    return `${edge.fromNodeId} -->|${edge.label}| ${edge.toNodeId}`;
  }).join('\n');

  mermaidString += `${edgeDefinitions}\n`;

  return mermaidString.trim();
}

export {
  renderMermaidSimpleGraph,
  ToolCallNode,
  DependencyEdge,
  GraphStructure
};