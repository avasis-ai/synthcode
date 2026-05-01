import { Graph } from "./graph-types";

export type SemanticDriftReport = {
  conceptDrift: {
    conceptId: string;
    oldScore: number;
    newScore: number;
    severity: 'Low' | 'Medium' | 'High';
    description: string;
  }[];
  relationshipDrift: {
    sourceId: string;
    targetId: string;
    oldWeight: number;
    newWeight: number;
    severity: 'Low' | 'Medium' | 'High';
    description: string;
  }[];
  overallSimilarityScore: number;
  driftDetected: boolean;
};

export class SemanticContextGraphDiffer {
  private readonly driftThreshold: number;

  constructor(driftThreshold: number = 0.1) {
    this.driftThreshold = driftThreshold;
  }

  private calculateSemanticSimilarity(graphA: Graph, graphB: Graph): number {
    // Placeholder for advanced embedding distance calculation (e.g., Cosine distance on aggregated node/edge embeddings)
    // In a real implementation, this would involve fetching and comparing embeddings.
    const nodesA = graphA.nodes.length;
    const nodesB = graphB.nodes.length;
    if (nodesA === 0 && nodesB === 0) return 1.0;
    if (nodesA === 0 || nodesB === 0) return 0.0;

    // Simple heuristic: similarity based on node count ratio and edge count ratio
    const nodeRatio = Math.min(nodesA, nodesB) / Math.max(nodesA, nodesB);
    const edgeRatio = Math.min(graphA.edges.length, graphB.edges.length) / Math.max(graphA.edges.length, graphB.edges.length);

    return (nodeRatio + edgeRatio) / 2.0;
  }

  private analyzeConceptDrift(nodesA: Record<string, any[]>, nodesB: Record<string, any[]>): {
    conceptDrift: {
      conceptId: string;
      oldScore: number;
      newScore: number;
      severity: 'Low' | 'Medium' | 'High';
      description: string;
    }[];
  } {
    const drift: {
      conceptId: string;
      oldScore: number;
      newScore: number;
      severity: 'Low' | 'Medium' | 'High';
      description: string;
    }[] = [];

    // Assume nodesA and nodesB contain concept embeddings/scores for comparison
    const commonConcepts = new Set([...Object.keys(nodesA), ...Object.keys(nodesB)]);

    for (const conceptId of commonConcepts) {
      const oldScore = nodesA[conceptId]?.score || 0.5;
      const newScore = nodesB[conceptId]?.score || 0.5;

      const scoreDifference = Math.abs(oldScore - newScore);
      let severity: 'Low' | 'Medium' | 'High' = 'Low';

      if (scoreDifference > 0.3) {
        severity = 'High';
      } else if (scoreDifference > 0.15) {
        severity = 'Medium';
      }

      drift.push({
        conceptId: conceptId,
        oldScore: oldScore,
        newScore: newScore,
        severity: severity,
        description: `Semantic shift detected for concept ${conceptId}. Change magnitude: ${scoreDifference.toFixed(2)}.`
      });
    }
    return { conceptDrift: drift };
  }

  private analyzeRelationshipDrift(edgesA: any[], edgesB: any[]): {
    relationshipDrift: {
      sourceId: string;
      targetId: string;
      oldWeight: number;
      newWeight: number;
      severity: 'Low' | 'Medium' | 'High';
      description: string;
    }[];
  } {
    const drift: {
      sourceId: string;
      targetId: string;
      oldWeight: number;
      newWeight: number;
      severity: 'Low' | 'Medium' | 'High';
      description: string;
    }[] = [];

    // Simplified comparison: check for significant weight changes on common (source, target) pairs
    const getEdgeKey = (source: string, target: string) => `${source}->${target}`;
    const edgeMapA = new Map<string, number>();
    edgesA.forEach(edge => {
      const key = getEdgeKey(edge.source, edge.target);
      edgeMapA.set(key, edge.weight);
    });

    edgesB.forEach(edgeB => {
      const key = getEdgeKey(edgeB.source, edgeB.target);
      const oldWeight = edgeMapA.get(key) ?? 0;
      const newWeight = edgeB.weight;

      const weightDifference = Math.abs(oldWeight - newWeight);
      let severity: 'Low' | 'Medium' | 'High' = 'Low';

      if (weightDifference > 0.5) {
        severity = 'High';
      } else if (weightDifference > 0.2) {
        severity = 'Medium';
      }

      drift.push({
        sourceId: edgeB.source,
        targetId: edgeB.target,
        oldWeight: oldWeight,
        newWeight: newWeight,
        severity: severity,
        description: `Relationship strength change between ${edgeB.source} and ${edgeB.target}. Change: ${weightDifference.toFixed(2)}.`
      });
    });
    return { relationshipDrift: drift };
  }

  /**
   * Generates a detailed report comparing two graph states to detect semantic drift.
   * @param graphA The baseline graph state.
   * @param graphB The current graph state.
   * @returns A SemanticDriftReport detailing detected changes.
   */
  public generateReport(graphA: Graph, graphB: Graph): SemanticDriftReport {
    const overallSimilarity = this.calculateSemanticSimilarity(graphA, graphB);
    const driftDetected = overallSimilarity < (1.0 - this.driftThreshold);

    const conceptDrift = this.analyzeConceptDrift(
      graphA.nodes,
      graphB.nodes
    ).conceptDrift;

    const relationshipDrift = this.analyzeRelationshipDrift(
      graphA.edges,
      graphB.edges
    ).relationshipDrift;

    return {
      conceptDrift: conceptDrift,
      relationshipDrift: relationshipDrift,
      overallSimilarityScore: parseFloat(overallSimilarity.toFixed(4)),
      driftDetected: driftDetected,
    };
  }
}