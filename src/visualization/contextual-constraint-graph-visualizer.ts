import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ConstraintNode {
  id: string;
  label: string;
  description: string;
  contextual_impact: string;
}

export interface ConstraintEdge {
  sourceId: string;
  targetId: string;
  propagation_type: "influences" | "constrains" | "relates_to";
  details: string;
}

export interface ConstraintGraphPayload {
  nodes: ConstraintNode[];
  edges: ConstraintEdge[];
}

export class ContextualConstraintGraphVisualizer {
  private payload: ConstraintGraphPayload;

  constructor(payload: ConstraintGraphPayload) {
    this.payload = payload;
  }

  public renderGraph(): string {
    const nodes = this.payload.nodes.map(node => `    ${node.id}: ${node.label}`).join('\n');
    const edges = this.payload.edges.map(edge => `    ${edge.sourceId} --(${edge.propagation_type})--> ${edge.targetId} [${edge.details}]`).join('\n');

    const mermaidGraph = `graph TD\n${nodes}\n${edges}`;

    return `<!-- Mermaid Graph Visualization for Contextual Constraints -->\n\`\`\`mermaid\n${mermaidGraph}\n\`\`\`\n\nVisualization Data:\nNodes: ${this.payload.nodes.length}, Edges: ${this.payload.edges.length}`;
  }

  public getVisualizationData(): { nodes: ConstraintNode[]; edges: ConstraintEdge[] } {
    return {
      nodes: this.payload.nodes,
      edges: this.payload.edges,
    };
  }
}