import { SemanticGraph, Node, Edge } from "./semantic-graph-types";

export type SemanticGraphDiffPayload = {
  divergenceScore: number;
  nodeChanges: {
    nodeId: string;
    differences: {
      metadata: {
        field: string;
        oldValue: unknown;
        newValue: unknown;
        semanticDifference: number;
      }[];
      embeddingSimilarity: number;
    }[];
  };
  edgeChanges: {
    edgeId: string;
    sourceId: string;
    targetId: string;
    differences: {
      relationshipType: string;
      metadata: {
        field: string;
        oldValue: unknown;
        newValue: unknown;
        semanticDifference: number;
      }[];
      embeddingSimilarity: number;
    }[];
  };
};

export class SemanticContextGraphDiffer {
  private readonly embeddingSimilarityFunction: (a: unknown, b: unknown) => number;

  constructor(embeddingSimilarityFunction: (a: unknown, b: unknown) => number) {
    this.embeddingSimilarityFunction = embeddingSimilarityFunction;
  }

  private calculateNodeDifference(nodeA: Node, nodeB: Node): {
    differences: {
      metadata: {
        field: string;
        oldValue: unknown;
        newValue: unknown;
        semanticDifference: number;
      }[];
      embeddingSimilarity: number;
    };
  } {
    const metadataDiffs: {
      field: string;
      oldValue: unknown;
      newValue: unknown;
      semanticDifference: number;
    }[] = [];

    for (const key in nodeA.metadata) {
      const field = key as string;
      const oldValue = (nodeA.metadata as Record<string, unknown>)[field];
      const newValue = (nodeB.metadata as Record<string, unknown>)[field];

      if (oldValue !== newValue) {
        metadataDiffs.push({
          field: field,
          oldValue: oldValue,
          newValue: newValue,
          semanticDifference: Math.abs(this.embeddingSimilarityFunction(oldValue, newValue)),
        });
      }
    }

    const embeddingSimilarity = this.embeddingSimilarityFunction(nodeA.embedding, nodeB.embedding);

    return {
      differences: {
        metadata: metadataDiffs,
        embeddingSimilarity: embeddingSimilarity,
      },
    };
  }

  private calculateEdgeDifference(edgeA: Edge, edgeB: Edge): {
    differences: {
      relationshipType: string;
      metadata: {
        field: string;
        oldValue: unknown;
        newValue: unknown;
        semanticDifference: number;
      }[];
      embeddingSimilarity: number;
    };
  } {
    const metadataDiffs: {
      field: string;
      oldValue: unknown;
      newValue: unknown;
      semanticDifference: number;
    }[] = [];

    for (const key in edgeA.metadata) {
      const field = key as string;
      const oldValue = (edgeA.metadata as Record<string, unknown>)[field];
      const newValue = (edgeB.metadata as Record<string, unknown>)[field];

      if (oldValue !== newValue) {
        metadataDiffs.push({
          field: field,
          oldValue: oldValue,
          newValue: newValue,
          semanticDifference: Math.abs(this.embeddingSimilarityFunction(oldValue, newValue)),
        });
      }
    }

    const embeddingSimilarity = this.embeddingSimilarityFunction(edgeA.embedding, edgeB.embedding);

    return {
      differences: {
        relationshipType: "N/A",
        metadata: metadataDiffs,
        embeddingSimilarity: embeddingSimilarity,
      },
    };
  }

  public calculateDivergenceScore(graphA: SemanticGraph, graphB: SemanticGraph): SemanticGraphDiffPayload {
    const nodeChanges: {
      nodeId: string;
      differences: {
        metadata: {
          field: string;
          oldValue: unknown;
          newValue: unknown;
          semanticDifference: number;
        }[];
        embeddingSimilarity: number;
      };
    }[] = [];

    const edgeChanges: {
      edgeId: string;
      sourceId: string;
      targetId: string;
      differences: {
        relationshipType: string;
        metadata: {
          field: string;
          oldValue: unknown;
          newValue: unknown;
          semanticDifference: number;
        }[];
        embeddingSimilarity: number;
      };
    }[] = [];

    // Node Comparison
    for (const nodeId of new Set([...Object.keys(graphA.nodes), ...Object.keys(graphB.nodes)])) {
      const nodeA = graphA.nodes[nodeId] || { id: nodeId, metadata: {}, embedding: new Array(10).fill(0) } as Node;
      const nodeB = graphB.nodes[nodeId] || { id: nodeId, metadata: {}, embedding: new Array(10).fill(0) } as Node;

      if (nodeA.id !== nodeB.id) continue;

      nodeChanges.push({
        nodeId: nodeId,
        differences: this.calculateNodeDifference(nodeA, nodeB),
      });
    }

    // Edge Comparison
    for (const edgeId of new Set([...Object.keys(graphA.edges), ...Object.keys(graphB.edges)])) {
      const edgeA = graphA.edges[edgeId] || { id: edgeId, sourceId: "", targetId: "", metadata: {}, embedding: new Array(10).fill(0) } as Edge;
      const edgeB = graphB.edges[edgeId] || { id: edgeId, sourceId: "", targetId: "", metadata: {}, embedding: new Array(10).fill(0) } as Edge;

      if (edgeA.id !== edgeB.id) continue;

      edgeChanges.push({
        edgeId: edgeId,
        sourceId: edgeA.sourceId,
        targetId: edgeA.targetId,
        differences: this.calculateEdgeDifference(edgeA, edgeB),
      });
    }

    // Score Calculation (Simplified aggregation)
    let totalScore = 0;
    for (const change of nodeChanges) {
      totalScore += change.differences.metadata.length * 0.1;
      totalScore += Math.abs(change.differences.embeddingSimilarity);
    }
    for (const change of edgeChanges) {
      totalScore += change.differences.metadata.length * 0.05;
      totalScore += Math.abs(change.differences.embeddingSimilarity);
    }

    return {
      divergenceScore: Math.min(1.0, totalScore / 10.0),
      nodeChanges: nodeChanges,
      edgeChanges: edgeChanges,
    };
  }
}