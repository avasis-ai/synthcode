import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface GraphNode {
  id: string;
  type: string;
  payload: Record<string, unknown>;
}

interface GraphEdge {
  from: string;
  to: string;
  type: string;
  payload: Record<string, unknown>;
}

interface SemanticGraph {
  nodes: Record<string, GraphNode>;
  edges: GraphEdge[];
}

interface SemanticDiff {
  node_diffs: Record<string, {
    status: "added" | "removed" | "modified" | "unchanged";
    diff_details: {
      payload_diff: Record<string, unknown>;
      drift_score: number;
    };
  }>;
  edge_diffs: Record<string, {
    status: "added" | "removed" | "modified" | "unchanged";
    diff_details: {
      payload_diff: Record<string, unknown>;
      drift_score: number;
    };
  }>;
}

interface SemanticGraphDiff {
  node_diffs: Record<string, {
    status: "added" | "removed" | "modified" | "unchanged";
    diff_details: {
      payload_diff: Record<string, unknown>;
      drift_score: number;
    };
  }>;
  edge_diffs: Record<string, {
    status: "added" | "removed" | "modified" | "unchanged";
    diff_details: {
      payload_diff: Record<string, unknown>;
      drift_score: number;
    };
  }>;
}

class SemanticContextGraphDiffingService {
  private readonly DRIFT_THRESHOLD: number = 0.2;

  private deepComparePayload(
    oldPayload: Record<string, unknown>,
    newPayload: Record<string, unknown>
  ): {
    payload_diff: Record<string, unknown>;
    drift_score: number;
  } {
    const diff: Record<string, unknown> = {};
    let totalDrift = 0;
    let fieldCount = 0;

    const allKeys = new Set([
      ...Object.keys(oldPayload),
      ...Object.keys(newPayload),
    ]);

    for (const key of allKeys) {
      const oldValue = oldPayload[key];
      const newValue = newPayload[key];

      if (oldValue === undefined && newValue !== undefined) {
        diff[key] = { added: newValue };
        totalDrift += 0.1;
        fieldCount++;
      } else if (oldValue !== undefined && newValue === undefined) {
        diff[key] = { removed: oldValue };
        totalDrift += 0.15;
        fieldCount++;
      } else if (oldValue !== newValue) {
        if (typeof oldValue === 'object' && oldValue !== null && typeof newValue === 'object' && newValue !== null) {
          const nestedDiff = this.deepComparePayload(
            oldValue as Record<string, unknown>,
            newValue as Record<string, unknown>
          );
          diff[key] = { modified: nestedDiff };
          totalDrift += 0.05;
          fieldCount++;
        } else {
          diff[key] = { changed: { old: oldValue, new: newValue } };
          totalDrift += 0.2;
          fieldCount++;
        }
      }
    }

    const driftScore = Math.min(1.0, totalDrift / (fieldCount || 1));

    return {
      payload_diff: diff,
      drift_score: parseFloat(driftScore.toFixed(3)),
    };
  }

  private compareNode(
    oldNode: GraphNode,
    newNode: GraphNode
  ): {
    status: "added" | "removed" | "modified" | "unchanged";
    diff_details: {
      payload_diff: Record<string, unknown>;
      drift_score: number;
    };
  } {
    if (oldNode.id !== newNode.id) {
      return {
        status: "removed",
        diff_details: {
          payload_diff: {},
          drift_score: 0,
        },
      };
    }

    const { payload_diff, drift_score } = this.deepComparePayload(
      oldNode.payload,
      newNode.payload
    );

    if (Object.keys(payload_diff).length > 0 || Math.abs(drift_score - 0) > 0.01) {
      return {
        status: "modified",
        diff_details: {
          payload_diff,
          drift_score,
        },
      };
    }

    return {
      status: "unchanged",
      diff_details: {
        payload_diff: {},
        drift_score: 0,
      },
    };
  }

  private compareEdge(
    oldEdge: GraphEdge,
    newEdge: GraphEdge
  ): {
    status: "added" | "removed" | "modified" | "unchanged";
    diff_details: {
      payload_diff: Record<string, unknown>;
      drift_score: number;
    };
  } {
    if (oldEdge.from !== newEdge.from || oldEdge.to !== newEdge.to || oldEdge.type !== newEdge.type) {
      return {
        status: "modified",
        diff_details: {
          payload_diff: {
            structural_change: true,
          },
          drift_score: 0.5,
        },
      };
    }

    const { payload_diff, drift_score } = this.deepComparePayload(
      oldEdge.payload,
      newEdge.payload
    );

    if (Object.keys(payload_diff).length > 0 || Math.abs(drift_score - 0) > 0.01) {
      return {
        status: "modified",
        diff_details: {
          payload_diff,
          drift_score,
        },
      };
    }

    return {
      status: "unchanged",
      diff_details: {
        payload_diff: {},
        drift_score: 0,
      },
    };
  }

  public diff(
    oldGraph: SemanticGraph,
    newGraph: SemanticGraph
  ): SemanticGraphDiff {
    const nodeDiffs: Record<string, any> = {};
    const edgeDiffs: Record<string, any> = {};

    // 1. Node Comparison
    const oldNodeIds = new Set(Object.keys(oldGraph.nodes));
    const newNodeIds = new Set(Object.keys(newGraph.nodes));

    // Check for modified or unchanged nodes
    for (const id of oldNodeIds) {
      if (newNodeIds.has(id)) {
        const oldNode = oldGraph.nodes[id];
        const newNode = newGraph.nodes[id];
        nodeDiffs[id] = this.compareNode(oldNode, newNode);
      } else {
        // Node removed
        nodeDiffs[id] = {
          status: "removed",
          diff_details: {
            payload_diff: {},
            drift_score: 0,
          },
        };
      }
    }

    // Check for added nodes
    for (const id of newNodeIds) {
      if (!oldNodeIds.has(id)) {
        nodeDiffs[id] = {
          status: "added",
          diff_details: {
            payload_diff: {},
            drift_score: 0,
          },
        };
      }
    }

    // 2. Edge Comparison
    const oldEdgeMap = new Map<string, GraphEdge>();
    for (const edge of oldGraph.edges) {
      const key = `${edge.from}->${edge.to}:${edge.type}`;
      oldEdgeMap.set(key, edge);
    }

    const newEdgeMap = new Map<string, GraphEdge>();
    for (const edge of newGraph.edges) {
      const key = `${edge.from}->${edge.to}:${edge.type}`;
      newEdgeMap.set(key, edge);
    }

    // Check for modified or unchanged edges
    for (const [key, oldEdge] of oldEdgeMap.entries()) {
      if (newEdgeMap.has(key)) {
        const newEdge = newEdgeMap.get(key)!;
        edgeDiffs[key] = this.compareEdge(oldEdge, newEdge);
      } else {
        // Edge removed
        edgeDiffs[key] = {
          status: "removed",
          diff_details: {
            payload_diff: {},
            drift_score: 0,
          },
        };
      }
    }

    // Check for added edges
    for (const [key, newEdge] of newEdgeMap.entries()) {
      if (!oldEdgeMap.has(key)) {
        edgeDiffs[key] = {
          status: "added",
          diff_details: {
            payload_diff: {},
            drift_score: 0,
          },
        };
      }
    }

    return {
      node_diffs: nodeDiffs as Record<string, any>,
      edge_diffs: edgeDiffs as Record<string, any>,
    };
  }
}

export { SemanticContextGraphDiffingService };