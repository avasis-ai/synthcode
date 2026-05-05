import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface Node {
  id: string;
  type: string;
  attributes: Record<string, any>;
}

export interface Edge {
  sourceId: string;
  targetId: string;
  type: string;
  attributes: Record<string, any>;
}

export interface KnowledgeGraph {
  nodes: Node[];
  edges: Edge[];
}

export type ConflictResolutionStrategy = "LATEST" | "MOST_RELIABLE" | "MANUAL";

export interface MergeRules {
  nodeConflictStrategy: ConflictResolutionStrategy;
  edgeConflictStrategy: ConflictResolutionStrategy;
  reliabilityWeight: (sourceId: string) => number;
}

export class SemanticContextGraphMerger {
  private rules: MergeRules;

  constructor(rules: MergeRules) {
    this.rules = rules;
  }

  private resolveNodeConflict(
    existingNode: Node,
    newNode: Node,
    sourceId: string
  ): Node {
    const strategy = this.rules.nodeConflictStrategy;
    if (strategy === "LATEST") {
      return newNode;
    }
    if (strategy === "MOST_RELIABLE") {
      const existingWeight = this.rules.reliabilityWeight(existingNode.id);
      const newWeight = this.rules.reliabilityWeight(newNode.id);
      if (newWeight > existingWeight) {
        return newNode;
      }
      return existingNode;
    }
    // MANUAL strategy implies external handling, here we default to merging attributes
    return {
      ...existingNode,
      attributes: {
        ...existingNode.attributes,
        ...newNode.attributes,
      },
    };
  }

  private resolveEdgeConflict(
    existingEdge: Edge,
    newEdge: Edge,
    sourceId: string
  ): Edge {
    const strategy = this.rules.edgeConflictStrategy;
    if (strategy === "LATEST") {
      return newEdge;
    }
    if (strategy === "MOST_RELIABLE") {
      const existingWeight = this.rules.reliabilityWeight(existingEdge.sourceId);
      const newWeight = this.rules.reliabilityWeight(newEdge.sourceId);
      if (newWeight > existingWeight) {
        return newEdge;
      }
      return existingEdge;
    }
    // For edges, we prioritize the most specific link (simplification: keep existing)
    return existingEdge;
  }

  public merge(
    graphA: KnowledgeGraph,
    graphB: KnowledgeGraph,
    sourceAId: string,
    sourceBId: string
  ): KnowledgeGraph {
    const mergedNodesMap = new Map<string, Node>();
    const mergedEdgesMap = new Map<string, Edge>();

    const processGraph = (graph: KnowledgeGraph, sourceId: string) => {
      graph.nodes.forEach(node => {
        if (!mergedNodesMap.has(node.id)) {
          mergedNodesMap.set(node.id, node);
        } else {
          const existingNode = mergedNodesMap.get(node.id)!;
          mergedNodesMap.set(node.id, this.resolveNodeConflict(
            existingNode,
            node,
            sourceId
          ));
        }
      });

      graph.edges.forEach(edge => {
        const key = `${edge.sourceId}->${edge.targetId}:${edge.type}`;
        if (!mergedEdgesMap.has(key)) {
          mergedEdgesMap.set(key, edge);
        } else {
          const existingEdge = mergedEdgesMap.get(key)!;
          mergedEdgesMap.set(key, this.resolveEdgeConflict(
            existingEdge,
            edge,
            sourceId
          ));
        }
      });
    };

    processGraph(graphA, sourceAId);
    processGraph(graphB, sourceBId);

    const finalNodes = Array.from(mergedNodesMap.values());
    const finalEdges = Array.from(mergedEdgesMap.values());

    return {
      nodes: finalNodes,
      edges: finalEdges,
    };
  }
}

export { SemanticContextGraphMerger };