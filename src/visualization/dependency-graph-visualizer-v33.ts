import { DependencyGraph, Node, Edge } from "./dependency-graph-types";

export type CausalFlowEdge = {
  sourceNodeId: string;
  targetNodeId: string;
  influenceDescription: string;
  strength: number;
};

export class DependencyGraphVisualizerV33 {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private calculateCausalFlowEdges(nodes: Node[], edges: Edge[]): CausalFlowEdge[] {
    const causalEdges: CausalFlowEdge[] = [];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;

        const sourceNode = nodes[i];
        const targetNode = nodes[j];

        // Simplified heuristic: Check for temporal proximity and content overlap/influence
        // In a real scenario, this would involve deep semantic analysis of node content.
        const timeDifference = Math.abs(sourceNode.timestamp - targetNode.timestamp);
        const contentSimilarityScore = this.calculateContentSimilarity(sourceNode, targetNode);

        // Thresholds for identifying potential causal flow
        const TEMPORAL_THRESHOLD_MS = 5000;
        const SIMILARITY_THRESHOLD = 0.6;

        if (timeDifference < TEMPORAL_THRESHOLD_MS && contentSimilarityScore > SIMILARITY_THRESHOLD) {
          // Check if a direct edge already exists (to avoid redundant visualization)
          const directEdgeExists = edges.some(edge =>
            (edge.sourceId === sourceNode.id && edge.targetId === targetNode.id) ||
            (edge.sourceId === targetNode.id && edge.targetId === sourceNode.id)
          );

          if (!directEdgeExists) {
            causalEdges.push({
              sourceNodeId: sourceNode.id,
              targetNodeId: targetNode.id,
              influenceDescription: `Implicit flow detected: ${sourceNode.type} influenced ${targetNode.type} due to temporal proximity and content overlap.`,
              strength: contentSimilarityScore * (1 - Math.abs(timeDifference / TEMPORAL_THRESHOLD_MS)),
            });
          }
        }
      }
    }
    return causalEdges;
  }

  private calculateContentSimilarity(nodeA: Node, nodeB: Node): number {
    // Placeholder for advanced NLP/Semantic similarity calculation
    const contentA = nodeA.content || "";
    const contentB = nodeB.content || "";

    if (!contentA || !contentB) return 0.0;

    // Simple Jaccard-like similarity on word sets for demonstration
    const wordsA = new Set(contentA.toLowerCase().match(/\b\w{3,}\b/g) || []);
    const wordsB = new Set(contentB.toLowerCase().match(/\b\w{3,}\b/g) || []);

    if (wordsA.size === 0 || wordsB.size === 0) return 0.0;

    const intersection = new Set([...wordsA].filter(word => wordsB.has(word)));
    const unionSize = new Set([...wordsA, ...wordsB]).size;

    return intersection.size / Math.max(wordsA.size, wordsB.size);
  }

  /**
   * Processes the graph to identify and return CausalFlowEdges.
   * @returns {CausalFlowEdge[]} An array of detected implicit causal flows.
   */
  public visualizeCausalFlows(): CausalFlowEdge[] {
    const nodes = this.graph.nodes;
    const edges = this.graph.edges;

    return this.calculateCausalFlowEdges(nodes, edges);
  }
}