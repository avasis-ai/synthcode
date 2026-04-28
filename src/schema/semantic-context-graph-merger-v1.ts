import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type GraphNodeId = string;
type GraphEdgeId = string;

interface Node {
  id: GraphNodeId;
  metadata: Record<string, unknown>;
}

interface Edge {
  id: GraphEdgeId;
  source: GraphNodeId;
  target: GraphNodeId;
  metadata: Record<string, unknown>;
}

interface SemanticContextGraph {
  nodes: Node[];
  edges: Edge[];
}

type MergeStrategy = "weighted_average" | "first_seen";

interface MergedGraph {
  nodes: Record<GraphNodeId, Node>;
  edges: Record<GraphEdgeId, Edge>;
}

type NodeMetadata = Record<string, unknown>;
type EdgeMetadata = Record<string, unknown>;

const calculateWeightedAverage = (
  existing: unknown,
  incoming: unknown,
  weight: number
): unknown => {
  if (typeof existing !== 'number' || typeof incoming !== 'number' || weight <= 0) {
    return incoming;
  }
  return (existing * 1 + incoming * weight) / (1 + weight);
};

const mergeNodeMetadata = (
  existing: NodeMetadata,
  incoming: NodeMetadata,
  strategy: MergeStrategy
): NodeMetadata => {
  const merged: NodeMetadata = { ...existing };
  for (const key in incoming) {
    if (Object.prototype.hasOwnProperty.call(incoming, key)) {
      const incomingValue = incoming[key];
      const existingValue = existing[key];

      if (existingValue === undefined) {
        merged[key] = incomingValue;
      } else if (strategy === "weighted_average" && typeof existingValue === 'number' && typeof incomingValue === 'number') {
        // Simplified weighted average for demonstration, assuming equal weight for simplicity if not specified
        merged[key] = (existingValue + incomingValue) / 2;
      } else {
        // For non-numeric conflicts, first-seen (keeping existing) or simple overwrite (if desired)
        merged[key] = existingValue;
      }
    }
  }
  return merged;
};

const mergeEdgeMetadata = (
  existing: EdgeMetadata,
  incoming: EdgeMetadata,
  strategy: MergeStrategy
): EdgeMetadata => {
  const merged: EdgeMetadata = { ...existing };
  for (const key in incoming) {
    if (Object.prototype.hasOwnProperty.call(incoming, key)) {
      const incomingValue = incoming[key];
      const existingValue = existing[key];

      if (existingValue === undefined) {
        merged[key] = incomingValue;
      } else if (strategy === "weighted_average" && typeof existingValue === 'number' && typeof incomingValue === 'number') {
        merged[key] = (existingValue + incomingValue) / 2;
      } else {
        merged[key] = existingValue;
      }
    }
  }
  return merged;
};

const mergeGraph = (
  graphs: SemanticContextGraph[],
  strategy: MergeStrategy
): MergedGraph => {
  const nodeMap: Map<GraphNodeId, Node> = new Map();
  const edgeMap: Map<GraphEdgeId, Edge> = new Map();

  const processGraph = (graph: SemanticContextGraph) => {
    // Process Nodes
    for (const node of graph.nodes) {
      if (nodeMap.has(node.id)) {
        const existingNode = nodeMap.get(node.id)!;
        const mergedMetadata = mergeNodeMetadata(
          existingNode.metadata,
          node.metadata,
          strategy
        );
        nodeMap.set(node.id, {
          id: node.id,
          metadata: mergedMetadata,
        });
      } else {
        nodeMap.set(node.id, {
          id: node.id,
          metadata: node.metadata,
        });
      }
    }

    // Process Edges
    for (const edge of graph.edges) {
      if (edgeMap.has(edge.id)) {
        const existingEdge = edgeMap.get(edge.id)!;
        const mergedMetadata = mergeEdgeMetadata(
          existingEdge.metadata,
          edge.metadata,
          strategy
        );
        edgeMap.set(edge.id, {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          metadata: mergedMetadata,
        });
      } else {
        edgeMap.set(edge.id, {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          metadata: edge.metadata,
        });
      }
    }
  };

  graphs.forEach(processGraph);

  const finalNodes: Node[] = Array.from(nodeMap.values());
  const finalEdges: Edge[] = Array.from(edgeMap.values());

  return {
    nodes: finalNodes.reduce((acc, node) => ({ ...acc, [node.id]: node }), {}),
    edges: finalEdges.reduce((acc, edge) => ({ ...acc, [edge.id]: edge }), {}),
  };
};

export {
  mergeGraph,
};