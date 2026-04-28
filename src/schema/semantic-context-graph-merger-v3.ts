import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ConflictResolutionStrategy = "weightedAverage" | "majorityVote" | "firstWins" | "lastWins";

export interface GraphNode {
  id: string;
  metadata: Record<string, unknown>;
  connections: {
    source: string;
    target: string;
    metadata: Record<string, unknown>;
  }[];
}

export interface GraphEdge {
  source: string;
  target: string;
  metadata: Record<string, unknown>;
}

export interface GraphContext {
  nodes: Map<string, GraphNode>;
  edges: Set<string>; // Store unique edge identifiers (e.g., "source->target")
}

export interface MergerOptions {
  strategy: ConflictResolutionStrategy;
  nodeWeight?: number;
  edgeWeight?: number;
}

export class SemanticContextGraphMergerV3 {
  private options: MergerOptions;

  constructor(options: MergerOptions) {
    this.options = {
      strategy: "majorityVote",
      nodeWeight: 1.0,
      edgeWeight: 1.0,
      ...options,
    };
  }

  private resolveNodeConflict(
    existingNode: GraphNode,
    incomingNode: GraphNode,
    strategy: ConflictResolutionStrategy,
    weight: number
  ): GraphNode {
    if (strategy === "firstWins") {
      return existingNode;
    }
    if (strategy === "lastWins") {
      return incomingNode;
    }

    const mergedMetadata: Record<string, unknown> = { ...existingNode.metadata };

    for (const key in incomingNode.metadata) {
      const incomingValue = incomingNode.metadata[key];
      const existingValue = existingNode.metadata[key];

      if (existingValue === undefined) {
        mergedMetadata[key] = incomingValue;
      } else if (typeof existingValue === 'object' && existingValue !== null && typeof incomingValue === 'object' && incomingValue !== null) {
        // Simple object merge for metadata if both are objects
        mergedMetadata[key] = { ...existingValue, ...incomingValue } as unknown as Record<string, unknown>;
      } else if (typeof existingValue === 'string' && typeof incomingValue === 'string') {
        if (strategy === "weightedAverage") {
          // Placeholder for complex string averaging/consensus
          mergedMetadata[key] = `Consensus(${existingValue}, ${incomingValue})`;
        } else if (strategy === "majorityVote") {
          // Simple majority vote simulation
          mergedMetadata[key] = `${existingValue} | ${incomingValue}`;
        } else {
          mergedMetadata[key] = incomingValue; // Fallback
        }
      } else {
        // Conflict detected, apply strategy
        if (strategy === "majorityVote") {
          mergedMetadata[key] = `Conflict(${existingValue}, ${incomingValue})`;
        } else {
          mergedMetadata[key] = incomingValue; // Default to incoming
        }
      }
    }

    // Combine connections (simplified: just append unique ones)
    const combinedConnections: GraphNode["connections"] = [...existingNode.connections];
    const newConnections = incomingNode.connections.filter(conn =>
      !existingNode.connections.some(existing =>
        existing.source === conn.source && existing.target === conn.target
      )
    );
    combinedConnections.push(...newConnections);

    return {
      ...existingNode,
      metadata: mergedMetadata,
      connections: combinedConnections,
    };
  }

  private resolveEdgeConflict(
    existingEdge: GraphEdge,
    incomingEdge: GraphEdge,
    strategy: ConflictResolutionStrategy,
    weight: number
  ): GraphEdge {
    if (strategy === "firstWins") {
      return existingEdge;
    }
    if (strategy === "lastWins") {
      return incomingEdge;
    }

    const mergedMetadata: Record<string, unknown> = { ...existingEdge.metadata };

    for (const key in incomingEdge.metadata) {
      const incomingValue = incomingEdge.metadata[key];
      const existingValue = existingEdge.metadata[key];

      if (existingValue === undefined) {
        mergedMetadata[key] = incomingValue;
      } else if (typeof existingValue === 'string' && typeof incomingValue === 'string') {
        if (strategy === "weightedAverage") {
          mergedMetadata[key] = `Consensus(${existingValue}, ${incomingValue})`;
        } else if (strategy === "majorityVote") {
          mergedMetadata[key] = `Conflict(${existingValue}, ${incomingValue})`;
        } else {
          mergedMetadata[key] = incomingValue;
        }
      } else {
        mergedMetadata[key] = incomingValue;
      }
    }

    return {
      ...existingEdge,
      metadata: mergedMetadata,
    };
  }

  public merge(
    existingContext: GraphContext,
    incomingContext: GraphContext
  ): GraphContext {
    const mergedNodes = new Map<string, GraphNode>();
    const mergedEdges = new Set<string>();

    // 1. Merge Nodes
    for (const [id, existingNode] of existingContext.nodes.entries()) {
      const incomingNode = incomingContext.nodes.get(id);
      if (incomingNode) {
        const resolvedNode = this.resolveNodeConflict(
          existingNode,
          incomingNode,
          this.options.strategy,
          this.options.nodeWeight
        );
        mergedNodes.set(id, resolvedNode);
      } else {
        mergedNodes.set(id, existingNode);
      }
    }

    for (const [id, incomingNode] of incomingContext.nodes.entries()) {
      if (!existingContext.nodes.has(id)) {
        mergedNodes.set(id, incomingNode);
      }
    }

    // 2. Merge Edges (and update node connections implicitly)
    const allEdges = new Map<string, GraphEdge>();

    // Process existing edges
    for (const edgeId of existingContext.edges) {
      // In a real scenario, we'd fetch the edge details. Here, we simulate by checking node connections.
      // For simplicity, we assume the edge metadata is derived from the nodes' connection lists.
      // We'll just ensure the edge ID is present.
      allEdges.set(edgeId, { source: "", target: "", metadata: {} } as GraphEdge);
    }

    // Process incoming edges
    for (const [id, incomingNode] of incomingContext.nodes.entries()) {
      for (const connection of incomingNode.connections) {
        const edgeKey = `${connection.source}->${connection.target}`;
        const incomingEdge: GraphEdge = {
          source: connection.source,
          target: connection.target,
          metadata: connection.metadata,
        };

        if (!allEdges.has(edgeKey)) {
          allEdges.set(edgeKey, incomingEdge);
        } else {
          const existingEdge = allEdges.get(edgeKey)!;
          const resolvedEdge = this.resolveEdgeConflict(
            existingEdge,
            incomingEdge,
            this.options.strategy,
            this.options.edgeWeight
          );
          allEdges.set(edgeKey, resolvedEdge);
        }
      }
    }

    // Finalize the merged context
    const mergedContext: GraphContext = {
      nodes: mergedNodes,
      edges: new Set(Array.from(allEdges.keys())),
    };

    return mergedContext;
  }
}