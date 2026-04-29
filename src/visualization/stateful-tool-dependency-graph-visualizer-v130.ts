import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface Node {
  id: string;
  label: string;
  type: "tool" | "user" | "assistant";
}

export interface Edge {
  sourceId: string;
  targetId: string;
  relationship: string;
}

export interface StatefulGraphUpdate {
  step: number;
  nodes: Node[];
  edges: Edge[];
  changes: {
    addedNodes: string[];
    removedNodes: string[];
    addedEdges: { sourceId: string; targetId: string; relationship: string }[];
    removedEdges: { sourceId: string; targetId: string; relationship: string }[];
  };
}

export class StatefulToolDependencyGraphVisualizer {
  private currentState: {
    nodes: Map<string, Node>;
    edges: Set<string>; // Using a set of serialized edge strings for easy tracking
  } = {
    nodes: new Map(),
    edges: new Set<string>()
  };

  constructor() {}

  private serializeEdge(sourceId: string, targetId: string, relationship: string): string {
    return `${sourceId}->${targetId}:${relationship}`;
  }

  private updateInternalState(update: StatefulGraphUpdate): void {
    const newNodes = new Map<string, Node>();
    const newEdges = new Set<string>();

    // 1. Update Nodes
    const currentNodes = this.currentState.nodes;
    const updatedNodes = new Map<string, Node>();

    // Start with existing nodes, then apply changes
    for (const [id, node] of currentNodes.entries()) {
      if (!update.changes.removedNodes.includes(id)) {
        updatedNodes.set(id, node);
      }
    }

    // Add/Update nodes from the payload
    for (const node of update.nodes) {
      if (!update.changes.removedNodes.includes(node.id)) {
        updatedNodes.set(node.id, node);
      }
    }

    // Apply added nodes (if they weren't in the initial set or if they represent an update)
    for (const id of update.changes.addedNodes) {
      // In a real scenario, we'd fetch the full node data for added nodes,
      // but here we assume the 'nodes' array contains the definitive list.
      // We rely on the 'nodes' array for the source of truth for the current step.
    }

    this.currentState.nodes = updatedNodes;

    // 2. Update Edges
    const currentEdges = this.currentState.edges;
    const updatedEdges = new Set<string>();

    // Rebuild edges based on the current 'nodes' and 'edges' payload for simplicity and accuracy
    // In a complex system, we'd track additions/removals precisely.
    // For this visualization, we rebuild the set from the provided edges list.
    for (const edge of update.edges) {
      const key = this.serializeEdge(edge.sourceId, edge.targetId, edge.relationship);
      updatedEdges.add(key);
    }

    this.currentState.edges = updatedEdges;
  }

  public processUpdate(update: StatefulGraphUpdate): {
    visualData: {
      nodes: Node[];
      edges: Edge[];
      changes: {
        addedNodes: string[];
        removedNodes: string[];
        addedEdges: { sourceId: string; targetId: string; relationship: string }[];
        removedEdges: { sourceId: string; targetId: string; relationship: string }[];
      };
    }
  }: {
    visualData: {
      nodes: Node[];
      edges: Edge[];
      changes: {
        addedNodes: string[];
        removedNodes: string[];
        addedEdges: { sourceId: string; targetId: string; relationship: string }[];
        removedEdges: { sourceId: string; targetId: string; relationship: string }[];
      };
    }
  } {
    this.updateInternalState(update);

    return {
      visualData: {
        nodes: update.nodes,
        edges: update.edges,
        changes: update.changes
      }
    };
  }

  public getCurrentState(): {
    nodes: Node[];
    edges: Edge[];
  } {
    return {
      nodes: Array.from(this.currentState.nodes.values()),
      edges: Array.from(this.currentState.edges).map(key => {
        const parts = key.split(':');
        const [sourceId, targetId, relationship] = parts;
        return {
          sourceId: sourceId.split('->')[0],
          targetId: targetId.split(':').slice(0, -1)[0],
          relationship: relationship
        };
      })
    };
  }
}