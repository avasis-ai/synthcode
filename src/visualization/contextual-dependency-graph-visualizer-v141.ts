import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ResourceConstraint {
  resourceName: string;
  minUsage: number;
  maxUsage: number;
}

export interface TemporalMetadata {
  startTimeMs: number;
  endTimeMs: number;
}

export interface DependencyNode {
  id: string;
  label: string;
  metadata: {
    temporal?: TemporalMetadata;
    resources?: ResourceConstraint[];
  };
}

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  metadata: {
    temporal?: TemporalMetadata;
    resources?: ResourceConstraint[];
  };
}

export interface ContextualGraphData {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface ContextualGraphPayload extends ContextualGraphData {
  // Additional context for scoring, e.g., global time window
  globalStartTimeMs: number;
  globalEndTimeMs: number;
}

export class ContextualDependencyGraphVisualizer {
  private payload: ContextualGraphPayload;

  constructor(payload: ContextualGraphPayload) {
    this.payload = payload;
  }

  private calculateContextualRelevanceScore(
    edge: DependencyEdge,
  ): number {
    const { metadata } = edge;
    if (!metadata || !metadata.temporal) {
      return 0.1;
    }

    const { startTimeMs, endTimeMs } = metadata.temporal;
    const { globalStartTimeMs, globalEndTimeMs } = this.payload;

    // 1. Temporal Overlap Score: How much does this edge's time overlap with the global context?
    const overlapStart = Math.max(startTimeMs, globalStartTimeMs);
    const overlapEnd = Math.min(endTimeMs, globalEndTimeMs);
    const temporalOverlap = Math.max(0, overlapEnd - overlapStart);
    const maxPossibleOverlap = globalEndTimeMs - globalStartTimeMs;
    const temporalScore = maxPossibleOverlap > 0 ? temporalOverlap / maxPossibleOverlap : 0;

    // 2. Resource Constraint Score: Penalize edges that use scarce or highly constrained resources.
    let resourceScore = 0;
    if (metadata.resources && metadata.resources.length > 0) {
      const totalConstraintWeight = metadata.resources.reduce(
        (acc, res) => acc + (res.maxUsage - res.minUsage),
        0
      );
      // Simple heuristic: higher total required range suggests higher criticality
      resourceScore = Math.min(1.0, totalConstraintWeight / 100);
    }

    // Combined Score: Weighted average emphasizing temporal relevance
    const contextualScore = (0.7 * temporalScore) + (0.3 * resourceScore);

    return Math.max(0.1, contextualScore);
  }

  private calculateNodeRelevanceScore(
    node: DependencyNode,
  ): number {
    const { metadata } = node;
    if (!metadata || !metadata.temporal) {
      return 0.1;
    }

    const { startTimeMs, endTimeMs } = metadata.temporal;
    const { globalStartTimeMs, globalEndTimeMs } = this.payload;

    const overlapStart = Math.max(startTimeMs, globalStartTimeMs);
    const overlapEnd = Math.min(endTimeMs, globalEndTimeMs);
    const temporalOverlap = Math.max(0, overlapEnd - overlapStart);
    const maxPossibleOverlap = globalEndTimeMs - globalStartTimeMs;

    return maxPossibleOverlap > 0 ? temporalOverlap / maxPossibleOverlap : 0.1;
  }

  public getVisualizedGraphData(): {
    nodes: { id: string; score: number; label: string };
    edges: { sourceId: string; targetId: string; score: number };
  } {
    const nodeScores = this.payload.nodes.map((node) => ({
      id: node.id,
      score: this.calculateNodeRelevanceScore(node),
      label: node.label,
    }));

    const edgeScores = this.payload.edges.map((edge) => ({
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      score: this.calculateContextualRelevanceScore(edge),
    }));

    return {
      nodes: nodeScores,
      edges: edgeScores,
    };
  }
}