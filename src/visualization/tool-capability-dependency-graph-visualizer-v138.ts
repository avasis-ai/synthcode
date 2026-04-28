import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface CapabilityNode {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, any>;
}

export interface DependencyEdge {
  sourceCapabilityId: string;
  targetCapabilityId: string;
  dependencyType: "requires" | "uses" | "is_precursor_to";
  context?: string;
}

export interface ToolCapabilityDependencyGraphPayload {
  nodes: CapabilityNode[];
  edges: DependencyEdge[];
}

export class ToolCapabilityDependencyGraphVisualizer {
  private payload: ToolCapabilityDependencyGraphPayload;

  constructor(payload: ToolCapabilityDependencyGraphPayload) {
    this.payload = payload;
  }

  public renderGraph(): string {
    const nodes = this.payload.nodes.map(node => `    ${node.id}["${node.name}"]`).join('\n');
    const edges = this.payload.edges.map(edge => {
      let relationship = "";
      switch (edge.dependencyType) {
        case "requires":
          relationship = "-->";
          break;
        case "uses":
          relationship = "-->";
          break;
        case "is_precursor_to":
          relationship = "-->";
          break;
      }
      return `    ${edge.sourceCapabilityId} ${relationship} ${edge.targetCapabilityId} ${edge.context ? `[${edge.context}]` : ''}`;
    }).join('\n');

    const mermaidGraph = `graph TD\n${nodes}\n${edges}\n`;
    return mermaidGraph;
  }

  public getGraphStructure(): { nodes: string[]; edges: string[] } {
    const nodeNames = this.payload.nodes.map(node => node.id);
    const edgeSources = this.payload.edges.map(edge => edge.sourceCapabilityId);
    const edgeTargets = this.payload.edges.map(edge => edge.targetCapabilityId);

    return {
      nodes: nodeNames,
      edges: [
        `${edgeSources.join(', ')}`,
        `${edgeTargets.join(', ')}`
      ]
    };
  }
}