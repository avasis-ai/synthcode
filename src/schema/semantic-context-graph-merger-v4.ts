import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type GraphNodeId = string;
type EdgeWeight = number;

interface GraphNode {
  id: GraphNodeId;
  type: string;
  attributes: Record<string, any>;
}

interface GraphEdge {
  source: GraphNodeId;
  target: GraphNodeId;
  weight: EdgeWeight;
  relationship: string;
}

interface SemanticContextGraph {
  nodes: Map<GraphNodeId, GraphNode>;
  edges: Map<string, GraphEdge>; // Key: `${source}->${target}:${relationship}`
}

type ConflictResolutionStrategy = "majority_vote" | "temporal_precedence" | "latest_wins";

interface GraphMergeOptions {
  strategy: ConflictResolutionStrategy;
}

export class SemanticContextGraphMergerV4 {
  private readonly defaultOptions: GraphMergeOptions = {
    strategy: "latest_wins",
  };

  private static createEmptyGraph(): SemanticContextGraph {
    return {
      nodes: new Map(),
      edges: new Map(),
    };
  }

  private static resolveNodeConflict(
    existingNode: GraphNode,
    newNode: GraphNode,
    strategy: ConflictResolutionStrategy
  ): GraphNode {
    if (strategy === "latest_wins") {
      return newNode;
    }
    if (strategy === "majority_vote") {
      // Simplified: Assume the node with the most non-null attributes wins, or just take the new one.
      return newNode;
    }
    // Default to existing if conflict resolution is complex or undefined
    return existingNode;
  }

  private static resolveEdgeConflict(
    existingEdge: GraphEdge,
    newEdge: GraphEdge,
    strategy: ConflictResolutionStrategy
  ): GraphEdge {
    if (strategy === "latest_wins") {
      return newEdge;
    }
    if (strategy === "majority_vote") {
      // Example: Average weights if relationship matches
      if (existingEdge.relationship === newEdge.relationship) {
        return {
          source: existingEdge.source,
          target: existingEdge.target,
          weight: (existingEdge.weight + newEdge.weight) / 2,
          relationship: existingEdge.relationship,
        };
      }
      return newEdge;
    }
    return newEdge;
  }

  public static mergeGraphs(
    graphs: SemanticContextGraph[],
    options: GraphMergeOptions = { strategy: "latest_wins" }
  ): SemanticContextGraph {
    if (!graphs || graphs.length === 0) {
      return SemanticContextGraphMergerV4.createEmptyGraph();
    }

    const mergedNodes = new Map<GraphNodeId, GraphNode>();
    const mergedEdges = new Map<string, GraphEdge>();

    for (const graph of graphs) {
      // Merge Nodes
      for (const [id, node] of graph.nodes.entries()) {
        const existingNode = mergedNodes.get(id);
        if (existingNode) {
          const resolvedNode = SemanticContextGraphMergerV4.resolveNodeConflict(
            existingNode,
            node,
            options.strategy
          );
          mergedNodes.set(id, resolvedNode);
        } else {
          mergedNodes.set(id, node);
        }
      }

      // Merge Edges
      for (const [key, edge] of graph.edges.entries()) {
        const existingEdge = mergedEdges.get(key);
        if (existingEdge) {
          const resolvedEdge = SemanticContextGraphMergerV4.resolveEdgeConflict(
            existingEdge,
            edge,
            options.strategy
          );
          mergedEdges.set(key, resolvedEdge);
        } else {
          mergedEdges.set(key, edge);
        }
      }
    }

    return {
      nodes: mergedNodes,
      edges: mergedEdges,
    };
  }

  public static validateGraphIntegrity(graph: SemanticContextGraph): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. Check for dangling edges (Source or Target node does not exist)
    for (const edge of graph.edges.values()) {
      if (!graph.nodes.has(edge.source)) {
        errors.push(`Edge ${edge.source}->${edge.target}: Source node ${edge.source} does not exist.`);
      }
      if (!graph.nodes.has(edge.target)) {
        errors.push(`Edge ${edge.source}->${edge.target}: Target node ${edge.target} does not exist.`);
      }
    }

    // 2. Check for node ID uniqueness (Handled by Map structure, but good practice to confirm)
    if (graph.nodes.size !== graph.nodes.size) {
        errors.push("Internal error: Node map size mismatch.");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}