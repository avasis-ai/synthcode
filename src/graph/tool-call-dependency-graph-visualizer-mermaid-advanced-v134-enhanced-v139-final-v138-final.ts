import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "../types";

export interface GraphNode {
  id: string;
  label: string;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  type: "standard" | "conditional" | "loop";
  condition?: string;
}

class GraphBuilder {
  private nodes: GraphNode[] = [];
  private edges: GraphEdge[] = [];

  constructor(nodes: GraphNode[], edges: GraphEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  public buildMermaidGraph(): { graphDefinition: string; nodes: string[]; edges: string[] } {
    const nodeIds = this.nodes.map(node => node.id);
    const nodeDefinitions = this.nodes.map(node => `${node.id}["${node.label}"]`);
    const edgeDefinitions = this.edges.map(edge => {
      let link = `${edge.source} --> ${edge.target}`;
      let label = `(${edge.label})`;
      let finalLink = link;

      if (edge.type === "conditional") {
        finalLink = `${edge.source} -- "${edge.condition}" --> ${edge.target}`;
      } else if (edge.type === "loop") {
        finalLink = `${edge.source} -- "${edge.label}" --> ${edge.target} (Loop)`;
      } else {
        finalLink = `${edge.source} --> ${edge.target} : ${edge.label}`;
      }
      return finalLink;
    });

    return {
      graphDefinition: `graph TD\n${nodeDefinitions.join('\n')}\n\n${edgeDefinitions.join('\n')}`,
      nodes: nodeIds,
      edges: edgeDefinitions
    };
  }
}

export function visualize(
  nodes: GraphNode[],
  edges: GraphEdge[]
): string {
  const builder = new GraphBuilder(nodes, edges);
  const { graphDefinition } = builder.buildMermaidGraph();
  return `graph TD\n${graphDefinition}`;
}