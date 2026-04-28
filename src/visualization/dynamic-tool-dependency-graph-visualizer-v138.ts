import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type NodeId = string;
export type EdgeId = string;

export interface GraphNode {
  id: NodeId;
  label: string;
  type: "tool" | "step" | "data";
  metadata: Record<string, unknown>;
}

export interface GraphEdge {
  id: EdgeId;
  source: NodeId;
  target: NodeId;
  type: "dependency" | "flow";
  metadata: Record<string, unknown>;
}

export interface GraphState {
  nodes: Record<NodeId, GraphNode>;
  edges: Record<EdgeId, GraphEdge>;
}

export interface DynamicGraphPayload {
  addedNodes?: GraphNode[];
  removedNodesIds?: NodeId[];
  addedEdges?: GraphEdge[];
  removedEdgesIds?: EdgeId[];
  // Optional: A mechanism to update metadata on existing nodes/edges
  updatedNodes?: Record<NodeId, Partial<GraphNode>>;
  updatedEdges?: Record<EdgeId, Partial<GraphEdge>>;
}

export class DynamicToolDependencyGraphVisualizer {
  private currentState: GraphState;

  constructor(initialState: GraphState) {
    this.currentState = initialState;
  }

  private mergeNodes(currentNodes: Record<NodeId, GraphNode>, addedNodes: GraphNode[], removedNodesIds: NodeId[] | undefined, updatedNodes: Record<NodeId, Partial<GraphNode>> | undefined): Record<NodeId, GraphNode> {
    let newNodes = { ...currentNodes };

    if (removedNodesIds) {
      removedNodesIds.forEach((id) => {
        delete newNodes[id];
      });
    }

    if (addedNodes) {
      addedNodes.forEach((node) => {
        newNodes[node.id] = node;
      });
    }

    if (updatedNodes) {
      Object.keys(updatedNodes).forEach((id) => {
        const partial = updatedNodes[id];
        if (newNodes[id]) {
          newNodes[id] = { ...newNodes[id], ...partial } as GraphNode;
        }
      });
    }

    return newNodes;
  }

  private mergeEdges(currentEdges: Record<EdgeId, GraphEdge>, addedEdges: GraphEdge[], removedEdgesIds: EdgeId[] | undefined, updatedEdges: Record<EdgeId, Partial<GraphEdge>> | undefined): Record<EdgeId, GraphEdge> {
    let newEdges = { ...currentEdges };

    if (removedEdgesIds) {
      removedEdgesIds.forEach((id) => {
        delete newEdges[id];
      });
    }

    if (addedEdges) {
      addedEdges.forEach((edge) => {
        newEdges[edge.id] = edge;
      });
    }

    if (updatedEdges) {
      Object.keys(updatedEdges).forEach((id) => {
        const partial = updatedEdges[id];
        if (newEdges[id]) {
          newEdges[id] = { ...newEdges[id], ...partial } as GraphEdge;
        }
      });
    }

    return newEdges;
  }

  public renderUpdate(payload: DynamicGraphPayload): GraphState {
    let newState: GraphState;

    const newNodes = this.mergeNodes(
      this.currentState.nodes,
      payload.addedNodes ?? [],
      payload.removedNodesIds,
      payload.updatedNodes
    );

    const newEdges = this.mergeEdges(
      this.currentState.edges,
      payload.addedEdges ?? [],
      payload.removedEdgesIds,
      payload.updatedEdges
    );

    newState = {
      nodes: newNodes,
      edges: newEdges,
    };

    this.currentState = newState;
    return newState;
  }

  public getCurrentState(): GraphState {
    return { ...this.currentState };
  }
}