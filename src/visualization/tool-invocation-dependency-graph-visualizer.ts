import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "../types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ToolInvocationGraphData {
  nodes: ToolNode[];
  edges: ToolEdge[];
}

export interface ToolNode {
  id: string;
  type: "tool_call" | "data_source" | "user_input";
  label: string;
  metadata: Record<string, any>;
}

export interface ToolEdge {
  sourceId: string;
  targetId: string;
  type: "data_flow" | "temporal" | "resource_dependency";
  metadata: Record<string, any>;
}

export class ToolInvocationDependencyGraphVisualizer {
  private graphData: ToolInvocationGraphData;

  constructor(graphData: ToolInvocationGraphData) {
    this.graphData = graphData;
  }

  public renderGraph(): string {
    const nodes = this.graphData.nodes.map(node => `  - ${node.id}: ${node.label} (${node.type})`).join('\n');
    const edges = this.graphData.edges.map(edge => `  - ${edge.sourceId} --(${edge.type})--> ${edge.targetId} (Meta: ${JSON.stringify(edge.metadata)})`).join('\n');

    const mermaidGraph = `graph TD\n${nodes}\n${edges}\n\n%% Visualization Placeholder: In a real implementation, this would render SVG/Canvas based on graph structure.`;
    return mermaidGraph;
  }

  public getToolNodeDetails(nodeId: string): Record<string, any> | null {
    const node = this.graphData.nodes.find(n => n.id === nodeId);
    return node ? { id: node.id, label: node.label, metadata: node.metadata } : null;
  }

  public getToolEdgeDetails(sourceId: string, targetId: string): Record<string, any> | null {
    const edge = this.graphData.edges.find(e => e.sourceId === sourceId && e.targetId === targetId);
    return edge ? { source: edge.sourceId, target: edge.targetId, type: edge.type, metadata: edge.metadata } : null;
  }
}