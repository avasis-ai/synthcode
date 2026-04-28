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
  type: "message" | "tool_call" | "context";
  label: string;
  metadata: Record<string, any>;
  startTime: number;
  endTime: number;
}

export interface GraphEdge {
  fromId: string;
  toId: string;
  type: "dependency" | "temporal" | "resource_flow";
  metadata: Record<string, any>;
}

export interface StateUpdatePayload {
  timestamp: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class StatefulToolDependencyGraphVisualizer {
  private currentState: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  } = {
    nodes: [],
    edges: [],
  };

  constructor() {}

  private validatePayload(payload: StateUpdatePayload): boolean {
    if (!payload || typeof payload.timestamp !== "number") {
      return false;
    }
    return true;
  }

  public updateGraphState(payload: StateUpdatePayload): boolean {
    if (!this.validatePayload(payload)) {
      return false;
    }

    const newNodes = payload.nodes;
    const newEdges = payload.edges;

    // Simple merge/overwrite logic for demonstration
    const nodeMap = new Map<string, GraphNode>();
    const existingNodeIds = new Set(this.currentState.nodes.map((n) => n.id));

    // Merge nodes: prioritize new data, but keep existing structure if ID matches
    const mergedNodes: GraphNode[] = [...this.currentState.nodes];
    const updatedNodes: GraphNode[] = newNodes.map(newNode => {
      if (existingNodeIds.has(newNode.id)) {
        return { ...newNode, metadata: { ...newNode.metadata, ...this.currentState.nodes.find(n => n.id === newNode.id)?.metadata } };
      }
      return newNode;
    });

    // Simple replacement for edges for this simplified example
    const mergedEdges: GraphEdge[] = newEdges;

    this.currentState = {
      nodes: [...updatedNodes],
      edges: [...mergedEdges],
    };
    return true;
  }

  public renderGraph(renderer: (nodes: GraphNode[], edges: GraphEdge[]) => string): string {
    if (this.currentState.nodes.length === 0) {
      return "No graph data to render.";
    }
    return renderer(this.currentState.nodes, this.currentState.edges);
  }

  public getGraphState(): {
    nodes: GraphNode[];
    edges: GraphEdge[];
  } {
    return this.currentState;
  }
}