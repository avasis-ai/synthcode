import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface GraphNode {
  id: string;
  type: string;
  attributes: Record<string, any>;
  content: any;
}

interface GraphEdge {
  from: string;
  to: string;
  type: string;
  weight: number;
  attributes: Record<string, any>;
}

interface MergeReport {
  conflicts: {
    elementId: string;
    elementType: "node" | "edge";
    conflictingValues: any[];
    resolutionStrategy: string;
    resolvedValue: any;
    confidenceScore: number;
  }[];
  summary: {
    totalConflicts: number;
    resolvedConflicts: number;
  };
}

type ConflictResolutionStrategy = "majority-vote" | "highest-confidence-wins" | "manual-review-required";

export class SemanticContextGraphMergerV1001Advanced {
  private readonly strategy: ConflictResolutionStrategy;

  constructor(strategy: ConflictResolutionStrategy = "highest-confidence-wins") {
    this.strategy = strategy;
  }

  private calculateSimilarity(a: any, b: any): number {
    if (typeof a === 'string' && typeof b === 'string') {
      const lowerA = a.toLowerCase();
      const lowerB = b.toLowerCase();
      if (lowerA === lowerB) return 1.0;
      // Simple Jaccard-like similarity on words for demonstration
      const setA = new Set(lowerA.split(/\s+/).filter(s => s.length > 0));
      const setB = new Set(lowerB.split(/\s+/).filter(s => s.length > 0));
      if (setA.size === 0 || setB.size === 0) return 0.0;
      const intersection = new Set([...setA].filter(x => setB.has(x)));
      const unionSize = new Set([...setA, ...setB]).size;
      return intersection.size / Math.max(setA.size, setB.size);
    }
    // Fallback for non-string types
    return 0.5;
  }

  private resolveConflict(
    conflictingValues: any[],
    elementType: "node" | "edge"
  ): { resolvedValue: any; confidenceScore: number } {
    if (conflictingValues.length === 1) {
      return { resolvedValue: conflictingValues[0], confidenceScore: 1.0 };
    }

    if (this.strategy === "manual-review-required") {
      return { resolvedValue: undefined, confidenceScore: 0.1 };
    }

    if (this.strategy === "majority-vote") {
      const counts: Map<string, number> = new Map();
      let maxCount = 0;
      let majority: any = null;

      for (const value of conflictingValues) {
        const key = JSON.stringify(value);
        const count = (counts.get(key) || 0) + 1;
        counts.set(key, count);

        if (count > maxCount) {
          maxCount = count;
          majority = value;
        } else if (count === maxCount && majority === null) {
          majority = value;
        }
      }
      return { resolvedValue: majority, confidenceScore: maxCount / conflictingValues.length };
    }

    // Default: Highest Confidence Wins (using similarity score if applicable)
    let bestMatch: any = conflictingValues[0];
    let maxScore = 0;

    for (let i = 0; i < conflictingValues.length; i++) {
      for (let j = i + 1; j < conflictingValues.length; j++) {
        const score = this.calculateSimilarity(conflictingValues[i], conflictingValues[j]);
        if (score > maxScore) {
          maxScore = score;
          bestMatch = conflictingValues[i];
        }
      }
    }
    return { resolvedValue: bestMatch, confidenceScore: maxScore };
  }

  public merge(
    graphA: { nodes: GraphNode[]; edges: GraphEdge[] },
    graphB: { nodes: GraphNode[]; edges: GraphEdge[] }
  ): { mergedNodes: GraphNode[]; mergedEdges: GraphEdge[]; report: MergeReport } {
    const nodeMapA = new Map<string, GraphNode>();
    graphA.nodes.forEach(node => nodeMapA.set(node.id, node));

    const nodeMapB = new Map<string, GraphNode>();
    graphB.nodes.forEach(node => nodeMapB.set(node.id, node));

    const mergedNodesMap = new Map<string, GraphNode>();
    const conflictReports: MergeReport['conflicts'] = [];

    // 1. Merge Nodes
    const allNodeIds = new Set<string>([...nodeMapA.keys(), ...nodeMapB.keys()]);

    for (const nodeId of allNodeIds) {
      const nodeA = nodeMapA.get(nodeId);
      const nodeB = nodeMapB.get(nodeId);

      if (!nodeA && !nodeB) continue;

      if (nodeA && nodeB) {
        const mergedNode: GraphNode = {
          id: nodeId,
          type: nodeA.type === nodeB.type ? nodeA.type : "mixed",
          attributes: { ...nodeA.attributes, ...nodeB.attributes },
          content: nodeA.content || nodeB.content,
        };

        // Simulate attribute conflict detection for reporting
        const attrConflicts: Record<string, any[]> = {};
        for (const key of new Set([...Object.keys(nodeA.attributes), ...Object.keys(nodeB.attributes)])) {
          const vals: any[] = [];
          if (nodeA.attributes[key] !== undefined) vals.push(nodeA.attributes[key]);
          if (nodeB.attributes[key] !== undefined) vals.push(nodeB.attributes[key]);

          if (vals.length > 1) {
            attrConflicts[key] = vals;
          }
        }

        if (Object.keys(attrConflicts).length > 0) {
          for (const key in attrConflicts) {
            const values = attrConflicts[key];
            const { resolvedValue, confidenceScore } = this.resolveConflict(values, "node");
            conflictReports.push({
              elementId: nodeId,
              elementType: "node",
              conflictingValues: values,
              resolutionStrategy: this.strategy,
              resolvedValue: resolvedValue,
              confidenceScore: confidenceScore,
            });
          }
        }
        mergedNodesMap.set(nodeId, mergedNode);
      } else if (nodeA) {
        mergedNodesMap.set(nodeId, nodeA);
      } else {
        mergedNodesMap.set(nodeId, nodeB);
      }
    }

    // 2. Merge Edges (Simplified: Assuming edge IDs are unique across graphs for simplicity)
    const mergedEdgesMap = new Map<string, GraphEdge>();
    const edgeConflictReports: MergeReport['conflicts'] = [];

    const allEdges = [...graphA.edges, ...graphB.edges];

    for (const edge of allEdges) {
      // Use a composite key for uniqueness (e.g., sorted IDs + type)
      const edgeKey = [edge.from, edge.to, edge.type].sort().join("|");

      if (mergedEdgesMap.has(edgeKey)) {
        const existingEdge = mergedEdgesMap.get(edgeKey)!;
        const conflictingValues: any[] = [existingEdge, edge];

        const { resolvedValue, confidenceScore } = this.resolveConflict(conflictingValues, "edge");

        edgeConflictReports.push({
          elementId: edgeKey,
          elementType: "edge",
          conflictingValues: conflictingValues.map(e => e.attributes),
          resolutionStrategy: this.strategy,
          resolvedValue: resolvedValue,
          confidenceScore: confidenceScore,
        });

        // Overwrite with the resolved version (simplified)
        mergedEdgesMap.set(edgeKey, { ...existingEdge, ...edge, attributes: resolvedValue });
      } else {
        mergedEdgesMap.set(edgeKey, { ...edge });
      }
    }

    const mergedNodes = Array.from(mergedNodesMap.values());
    const mergedEdges = Array.from(mergedEdgesMap.values());

    const report: MergeReport = {
      conflicts: [...conflictReports, ...edgeConflictReports],
      summary: {
        totalConflicts: conflictReports.length + edgeConflictReports.length,
        resolvedConflicts: Math.min(conflictReports.length + edgeConflictReports.length, 100), // Placeholder for resolved count
      },
    };

    return {
      mergedNodes: mergedNodes,
      mergedEdges: mergedEdges,
      report: report,
    };
  }
}