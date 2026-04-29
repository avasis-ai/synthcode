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

export type DependencyType =
  | "INPUT_REQUIRED"
  | "OUTPUT_CONSUMED"
  | "PRECONDITION_MET"
  | "GENERAL_FLOW";

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  type: DependencyType;
  reason: string;
}

export interface GraphNode {
  id: string;
  type: "message" | "tool_call" | "thinking";
  content: any;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: DependencyEdge[];
}

export class ContextualDependencyGraphVisualizer {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private getNodeStyle(node: GraphNode): Record<string, string> {
    switch (node.type) {
      case "message":
        return {
          backgroundColor: "#e6e6fa",
          borderColor: "#9370db",
          labelColor: "#4b0082",
        };
      case "tool_call":
        return {
          backgroundColor: "#fffacd",
          borderColor: "#daa520",
          labelColor: "#b8860b",
        };
      case "thinking":
        return {
          backgroundColor: "#f0f8ff",
          borderColor: "#6495ed",
          labelColor: "#4682b4",
        };
      default:
        return {
          backgroundColor: "#ffffff",
          borderColor: "#cccccc",
          labelColor: "#333333",
        };
    }
  }

  private getEdgeStyle(type: DependencyType): Record<string, string> {
    switch (type) {
      case "INPUT_REQUIRED":
        return { stroke: "red", strokeWidth: "2px" };
      case "OUTPUT_CONSUMED":
        return { stroke: "green", strokeWidth: "2px" };
      case "PRECONDITION_MET":
        return { stroke: "blue", strokeWidth: "2px" };
      case "GENERAL_FLOW":
      default:
        return { stroke: "#999", strokeWidth: "1px" };
    }
  }

  public visualize(): {
    nodesStyle: Record<string, Record<string, string>>;
    edgesStyle: Record<string, { stroke: string; strokeWidth: string }>;
    visualData: {
      nodes: any[];
      links: any[];
    };
  } {
    const nodesStyle: Record<string, Record<string, string>> = {};
    const edgesStyle: Record<string, { stroke: string; strokeWidth: string }> = {};

    const nodeStyles = this.graph.nodes.map((node) => ({
      id: node.id,
      ...this.getNodeStyle(node),
    }));

    const edgeStyles = this.graph.edges.map((edge) => ({
      source: edge.sourceId,
      target: edge.targetId,
      ...this.getEdgeStyle(edge.type),
    }));

    return {
      nodesStyle: nodeStyles.reduce((acc, style) => ({ ...acc, [style.id]: style }), {}),
      edgesStyle: edgeStyles.reduce((acc, style) => ({ ...acc, [`${style.source}-${style.target}`]: style }), {}),
      visualData: {
        nodes: this.graph.nodes.map((node) => ({
          id: node.id,
          label: `${node.type.toUpperCase()}: ${node.id.substring(0, 10)}...`,
          style: this.getNodeStyle(node),
        })),
        links: this.graph.edges.map((edge) => ({
          source: edge.sourceId,
          target: edge.targetId,
          type: edge.type,
          reason: edge.reason,
          style: this.getEdgeStyle(edge.type),
        })),
      },
    };
  }
}