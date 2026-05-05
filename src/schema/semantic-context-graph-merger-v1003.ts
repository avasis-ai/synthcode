import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface ContextGraphPayload {
  nodes: Map<string, any>;
  edges: Map<string, any>;
  messages: Message[];
}

interface MergeRule {
  sourceTrustScore: number;
  temporalDecayFactor: number;
}

interface ConflictResolution {
  attribute: string;
  sourceA: any;
  sourceB: any;
  resolvedValue: any;
  winningSource: "A" | "B";
}

interface MergeReport {
  conflictsResolved: ConflictResolution[];
  mergedNodes: Map<string, any>;
  mergedEdges: Map<string, any>;
}

export class SemanticContextGraphMerger {
  private readonly defaultRules: Record<string, MergeRule> = {
    "user": { sourceTrustScore: 0.8, temporalDecayFactor: 0.1 },
    "assistant": { sourceTrustScore: 0.9, temporalDecayFactor: 0.05 },
    "tool": { sourceTrustScore: 0.7, temporalDecayFactor: 0.2 },
  };

  private getRule(role: "user" | "assistant" | "tool"): MergeRule {
    return this.defaultRules[role] || { sourceTrustScore: 0.5, temporalDecayFactor: 0.15 };
  }

  private calculateWeightedScore(
    valueA: any,
    valueB: any,
    roleA: "user" | "assistant" | "tool",
    roleB: "user" | "assistant" | "tool"
  ): { score: number; winner: "A" | "B" } {
    const ruleA = this.getRule(roleA);
    const ruleB = this.getRule(roleB);

    const scoreA = ruleA.sourceTrustScore * (1 - ruleA.temporalDecayFactor);
    const scoreB = ruleB.sourceTrustScore * (1 - ruleB.temporalDecayFactor);

    if (scoreA > scoreB) {
      return { score: scoreA, winner: "A" };
    } else if (scoreB > scoreA) {
      return { score: scoreB, winner: "B" };
    } else {
      return { score: scoreA + scoreB, winner: "A" }; // Tie-breaker: default to A
    }
  }

  private resolveAttributeConflict(
    key: string,
    valueA: any,
    valueB: any,
    roleA: "user" | "assistant" | "tool",
    roleB: "user" | "assistant" | "tool"
  ): { resolvedValue: any; winningSource: "A" | "B"; conflict: ConflictResolution | null } {
    if (valueA === valueB) {
      return { resolvedValue: valueA, winningSource: "A", conflict: null };
    }

    const { winner } = this.calculateWeightedScore(valueA, valueB, roleA, roleB);

    if (winner === "A") {
      return {
        resolvedValue: valueA,
        winningSource: "A",
        conflict: {
          attribute: key,
          sourceA: valueA,
          sourceB: valueB,
          resolvedValue: valueA,
          winningSource: "A",
        },
      };
    } else {
      return {
        resolvedValue: valueB,
        winningSource: "B",
        conflict: {
          attribute: key,
          sourceA: valueA,
          sourceB: valueB,
          resolvedValue: valueB,
          winningSource: "B",
        },
      };
    }
  }

  public mergeGraphs(
    graphA: ContextGraphPayload,
    graphB: ContextGraphPayload
  ): MergeReport {
    const mergedNodes = new Map<string, any>();
    const mergedEdges = new Map<string, any>();
    const conflictsResolved: ConflictResolution[] = [];

    // 1. Merge Nodes
    for (const [id, nodeA] of graphA.nodes.entries()) {
      const nodeB = graphB.nodes.get(id);
      if (nodeB) {
        const mergedNode: any = { ...nodeA };
        const keysA = Object.keys(nodeA);
        const keysB = Object.keys(nodeB);

        for (const key of new Set([...keysA, ...keysB])) {
          const valA = nodeA[key];
          const valB = nodeB[key];

          if (valA !== undefined && valB !== undefined && valA !== valB) {
            // Simplified conflict resolution for node attributes
            const resolved = this.resolveAttributeConflict(
              key, valA, valB, "assistant", "assistant"
            );
            mergedNode[key] = resolved.resolvedValue;
            if (resolved.conflict) {
              conflictsResolved.push(resolved.conflict);
            }
          } else if (valA !== undefined) {
            mergedNode[key] = valA;
          } else if (valB !== undefined) {
            mergedNode[key] = valB;
          }
        }
        mergedNodes.set(id, mergedNode);
      } else {
        mergedNodes.set(id, nodeA);
      }
    }

    for (const [id, nodeB] of graphB.nodes.entries()) {
      if (!mergedNodes.has(id)) {
        mergedNodes.set(id, nodeB);
      }
    }

    // 2. Merge Edges (Simplified: assuming edge attributes are the primary conflict point)
    for (const [id, edgeA] of graphA.edges.entries()) {
      const edgeB = graphB.edges.get(id);
      if (edgeB) {
        const mergedEdge: any = { ...edgeA };
        const keysA = Object.keys(edgeA);
        const keysB = Object.keys(edgeB);

        for (const key of new Set([...keysA, ...keysB])) {
          const valA = edgeA[key];
          const valB = edgeB[key];

          if (valA !== undefined && valB !== undefined && valA !== valB) {
            const resolved = this.resolveAttributeConflict(
              key, valA, valB, "assistant", "assistant"
            );
            mergedEdge[key] = resolved.resolvedValue;
            if (resolved.conflict) {
              conflictsResolved.push(resolved.conflict);
            }
          } else if (valA !== undefined) {
            mergedEdge[key] = valA;
          } else if (valB !== undefined) {
            mergedEdge[key] = valB;
          }
        }
        mergedEdges.set(id, mergedEdge);
      } else {
        mergedEdges.set(id, edgeA);
      }
    }

    for (const [id, edgeB] of graphB.edges.entries()) {
      if (!mergedEdges.has(id)) {
        mergedEdges.set(id, edgeB);
      }
    }

    return {
      conflictsResolved,
      mergedNodes,
      mergedEdges,
    };
  }
}