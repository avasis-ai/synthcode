import { SemanticContextGraph } from "./semantic-context-graph";

export interface NodeDiff {
  nodeId: string;
  diffType: "ADDED" | "REMOVED" | "MODIFIED";
  details: {
    semanticSimilarity: number;
    semanticDriftScore: number;
    description: string;
  };
}

export interface EdgeDiff {
  edgeId: string;
  diffType: "ADDED" | "REMOVED" | "MODIFIED";
  details: {
    relationshipType: string;
    weightChange: number;
    description: string;
  };
}

export interface GraphDiffReport {
  nodeDiffs: NodeDiff[];
  edgeDiffs: EdgeDiff[];
  semanticDivergenceScore: number;
  summary: string;
}

export class SemanticContextGraphDiffer {
  private static readonly SEMANTIC_SIMILARITY_THRESHOLD = 0.7;
  private static readonly SEMANTIC_DRIFT_THRESHOLD = 0.2;

  public static calculateDiff(graphA: SemanticContextGraph, graphB: SemanticContextGraph): GraphDiffReport {
    const nodeDiffs: NodeDiff[] = [];
    const edgeDiffs: EdgeDiff[] = [];

    const nodeDiffs = SemanticContextGraphDiffer.compareNodes(graphA, graphB, nodeDiffs);
    const edgeDiffs = SemanticContextGraphDiffer.compareEdges(graphA, graphB, edgeDiffs);

    const divergenceScore = SemanticContextGraphDiffer.calculateDivergenceScore(nodeDiffs, edgeDiffs);

    const summary = SemanticContextGraphDiffer.generateSummary(nodeDiffs, edgeDiffs, divergenceScore);

    return {
      nodeDiffs,
      edgeDiffs,
      semanticDivergenceScore: divergenceScore,
      summary: summary,
    };
  }

  private static compareNodes(graphA: SemanticContextGraph, graphB: SemanticContextGraph, nodeDiffs: NodeDiff[]): NodeDiff[] {
    const allNodeIds = new Set<string>([...graphA.getNodeIds(), ...graphB.getNodeIds()]);
    const diffs: NodeDiff[] = [];

    for (const nodeId of allNodeIds) {
      const nodeA = graphA.getNode(nodeId);
      const nodeB = graphB.getNode(nodeId);

      if (!nodeA && nodeB) {
        diffs.push({
          nodeId: nodeId,
          diffType: "ADDED",
          details: {
            semanticSimilarity: 1.0,
            semanticDriftScore: 0.0,
            description: `Node added in Graph B: ${nodeB.getLabel()}`,
          },
        });
        continue;
      }

      if (nodeA && !nodeB) {
        diffs.push({
          nodeId: nodeId,
          diffType: "REMOVED",
          details: {
            semanticSimilarity: 0.0,
            semanticDriftScore: 1.0,
            description: `Node removed from Graph A: ${nodeA.getLabel()}`,
          },
        });
        continue;
      }

      if (nodeA && nodeB) {
        const similarity = SemanticContextGraphDiffer.calculateSimilarity(nodeA, nodeB);
        const drift = 1.0 - similarity;

        if (drift > SemanticContextGraphDiffer.SEMANTIC_DRIFT_THRESHOLD) {
          diffs.push({
            nodeId: nodeId,
            diffType: "MODIFIED",
            details: {
              semanticSimilarity: similarity,
              semanticDriftScore: drift,
              description: `Semantic drift detected. Similarity: ${similarity.toFixed(2)}`,
            },
          });
        }
      }
    }
    return diffs;
  }

  private static compareEdges(graphA: SemanticContextGraph, graphB: SemanticContextGraph, edgeDiffs: EdgeDiff[]): EdgeDiff[] {
    const allEdgeIds = new Set<string>();
    graphA.getEdges().forEach(edge => allEdgeIds.add(edge.getId()));
    graphB.getEdges().forEach(edge => allEdgeIds.add(edge.getId()));

    const diffs: EdgeDiff[] = [];

    for (const edgeId of allEdgeIds) {
      const edgeA = graphA.getEdge(edgeId);
      const edgeB = graphB.getEdge(edgeId);

      if (!edgeA && edgeB) {
        diffs.push({
          edgeId: edgeId,
          diffType: "ADDED",
          details: {
            relationshipType: edgeB.getRelationshipType(),
            weightChange: 0.0,
            description: `Edge added in Graph B: ${edgeB.getRelationshipType()}`,
          },
        });
        continue;
      }

      if (edgeA && !edgeB) {
        diffs.push({
          edgeId: edgeId,
          diffType: "REMOVED",
          details: {
            relationshipType: edgeA.getRelationshipType(),
            weightChange: 0.0,
            description: `Edge removed from Graph A: ${edgeA.getRelationshipType()}`,
          },
        });
        continue;
      }

      if (edgeA && edgeB) {
        const typeMatch = edgeA.getRelationshipType() === edgeB.getRelationshipType();
        const weightDiff = Math.abs(edgeA.getWeight() - edgeB.getWeight());
        const isModified = !typeMatch || weightDiff > 0.1;

        if (isModified) {
          diffs.push({
            edgeId: edgeId,
            diffType: "MODIFIED",
            details: {
              relationshipType: typeMatch ? edgeA.getRelationshipType() : "MISMATCH",
              weightChange: weightDiff,
              description: `Edge modified. Type match: ${typeMatch}, Weight change: ${weightDiff.toFixed(2)}`,
            },
          });
        }
      }
    }
    return diffs;
  }

  private static calculateSimilarity(nodeA: SemanticContextGraph["Node"], nodeB: SemanticContextGraph["Node"]): number {
    // Placeholder for advanced semantic similarity calculation (e.g., embedding cosine similarity)
    // For demonstration, we use a simple heuristic based on label overlap.
    const labelsA = nodeA.getLabel().toLowerCase();
    const labelsB = nodeB.getLabel().toLowerCase();
    const commonChars = [...new Set(labelsA.split(''))].filter(char => labelsB.includes(char));
    return Math.min(1.0, commonChars.length / Math.max(labelsA.length, labelsB.length) * 1.5);
  }

  private static calculateDivergenceScore(nodeDiffs: NodeDiff[], edgeDiffs: EdgeDiff[]): number {
    let score = 0.0;
    const totalDiffs = nodeDiffs.length + edgeDiffs.length;

    if (totalDiffs === 0) return 0.0;

    const weightedNodeDiffs = nodeDiffs.filter(d => d.diffType === "MODIFIED").length;
    const weightedEdgeDiffs = edgeDiffs.filter(d => d.diffType === "MODIFIED").length;

    // Simple weighted score: 1 point per diff, plus bonus for semantic drift
    score = (nodeDiffs.length * 0.3 + edgeDiffs.length * 0.3) + (weightedNodeDiffs * 0.2 + weightedEdgeDiffs * 0.2);

    return Math.min(1.0, score / (totalDiffs * 0.5));
  }

  private static generateSummary(nodeDiffs: NodeDiff[], edgeDiffs: EdgeDiff[], score: number): string {
    const addedNodes = nodeDiffs.filter(d => d.diffType === "ADDED").length;
    const removedNodes = nodeDiffs.filter(d => d.diffType === "REMOVED").length;
    const modifiedNodes = nodeDiffs.filter(d => d.diffType === "MODIFIED").length;
    const addedEdges = edgeDiffs.filter(d => d.diffType === "ADDED").length;
    const removedEdges = edgeDiffs.filter(d => d.diffType === "REMOVED").length;
    const modifiedEdges = edgeDiffs.filter(d => d.diffType === "MODIFIED").length;

    let summary = `Graph comparison complete. Semantic Divergence Score: ${score.toFixed(3)}.\n`;
    summary += `Nodes: Added=${addedNodes}, Removed=${removedNodes}, Modified=${modifiedNodes}.\n`;
    summary += `Edges: Added=${addedEdges}, Removed=${removedEdges}, Modified=${modifiedEdges}.\n`;

    if (score > 0.5) {
      summary += "WARNING: High divergence detected. Significant semantic shifts or structural changes are present.\n";
    } else if (score > 0.2) {
      summary += "NOTICE: Moderate divergence detected. Review modified components for expected changes.\n";
    } else {
      summary += "SUCCESS: Graphs appear semantically consistent with minimal structural changes.\n";
    }

    return summary;
  }
}