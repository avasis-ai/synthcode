import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface PreconditionCheck {
  name: string;
  description: string;
  // In a real system, this might contain logic or required inputs
}

export interface GraphNode {
  id: string;
  label: string;
  type: "precondition";
  details: string;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  label: string;
}

export type PreconditionGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

function buildPreconditionGraph(checks: PreconditionCheck[]): PreconditionGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  if (checks.length === 0) {
    return { nodes: [], edges: [] };
  }

  for (let i = 0; i < checks.length; i++) {
    const check = checks[i];
    const nodeId = `pre_${i}`;
    nodes.push({
      id: nodeId,
      label: `Precondition: ${check.name}`,
      type: "precondition",
      details: check.description,
    });

    if (i > 0) {
      const sourceId = `pre_${i - 1}`;
      edges.push({
        sourceId: sourceId,
        targetId: nodeId,
        label: "Must Pass",
      });
    }
  }

  return { nodes, edges };
}

function renderMermaidGraph(graph: PreconditionGraph): string {
  if (graph.nodes.length === 0) {
    return "graph TD\n    A[No Preconditions Defined]";
  }

  let mermaid = "graph TD\n";
  let nodeDefinitions: string[] = [];
  let edgeDefinitions: string[] = [];

  // Define nodes
  graph.nodes.forEach(node => {
    // Using a subgraph or specific styling might be better, but sticking to basic Mermaid syntax
    nodeDefinitions.push(`    ${node.id}["${node.label}\\n(${node.details})"]`);
  });

  // Define edges
  graph.edges.forEach(edge => {
    edgeDefinitions.push(`    ${edge.sourceId} -->|${edge.label}| ${edge.targetId}`);
  });

  mermaid += nodeDefinitions.join("\n") + "\n";
  mermaid += edgeDefinitions.join("\n");

  return mermaid;
}

export class ToolCallPreconditionChainVisualizer {
  static buildGraph(checks: PreconditionCheck[]): PreconditionGraph {
    return buildPreconditionGraph(checks);
  }

  static render(graph: PreconditionGraph): string {
    return renderMermaidGraph(graph);
  }
}