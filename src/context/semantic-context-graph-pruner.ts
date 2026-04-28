import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface GraphNode {
  id: string;
  content: ContentBlock;
  score: number;
}

interface GraphEdge {
  sourceId: string;
  targetId: string;
  weight: number;
}

export class SemanticContextGraphPruner {
  private readonly centralityThreshold: number;
  private readonly maxNodesToKeep: number;

  constructor(centralityThreshold: number = 0.1, maxNodesToKeep: number = 50) {
    this.centralityThreshold = centralityThreshold;
    this.maxNodesToKeep = maxNodesToKeep;
  }

  private calculateCentralityScores(nodes: GraphNode[], edges: GraphEdge[]): { nodeScores: Map<string, number>; edgeScores: Map<string, number> } {
    const nodeScores = new Map<string, number>();
    const edgeScores = new Map<string, number>();

    // Simplified simulation of centrality calculation (e.g., based on degree or simulated PageRank)
    // In a real implementation, this would involve complex graph algorithms.
    const nodeDegree = new Map<string, number>();
    nodes.forEach(node => nodeDegree.set(node.id, 0));

    edges.forEach(edge => {
      nodeDegree.set(edge.sourceId, (nodeDegree.get(edge.sourceId) || 0) + 1);
      nodeDegree.set(edge.targetId, (nodeDegree.get(edge.targetId) || 0) + 1);
      // Simulate edge weight based on connection count or content similarity
      edgeScores.set(`${edge.sourceId}-${edge.targetId}`, (edgeScores.get(`${edge.sourceId}-${edge.targetId}`) || 0) + 1);
    });

    nodeDegree.forEach((degree, id) => {
      nodeScores.set(id, degree / Math.sqrt(nodes.length)); // Simple normalization
    });

    return { nodeScores, edgeScores };
  }

  private pruneNodes(nodes: GraphNode[], nodeScores: Map<string, number>): GraphNode[] {
    const filteredNodes = nodes.filter(node => {
      const score = nodeScores.get(node.id) || 0;
      return score >= this.centralityThreshold;
    });

    if (filteredNodes.length > this.maxNodesToKeep) {
      // Secondary pruning: keep the top N nodes by score
      filteredNodes.sort((a, b) => (nodeScores.get(b.id) || 0) - (nodeScores.get(a.id) || 0));
      return filteredNodes.slice(0, this.maxNodesToKeep);
    }

    return filteredNodes;
  }

  private pruneEdges(edges: GraphEdge[], nodeScores: Map<string, number>): GraphEdge[] {
    return edges.filter(edge => {
      const sourceScore = nodeScores.get(edge.sourceId) || 0;
      const targetScore = nodeScores.get(edge.targetId) || 0;
      // Keep edges connecting nodes above a certain combined score threshold
      return (sourceScore + targetScore) / 2 >= this.centralityThreshold * 0.8;
    });
  }

  public prune(
    nodes: GraphNode[],
    edges: GraphEdge[]
  ): { nodes: GraphNode[]; edges: GraphEdge[] } {
    if (!nodes || nodes.length === 0) {
      return { nodes: [], edges: [] };
    }

    const { nodeScores, edgeScores } = this.calculateCentralityScores(nodes, edges);

    const prunedNodes = this.pruneNodes(nodes, nodeScores);
    const prunedEdges = this.pruneEdges(edges, nodeScores);

    return { nodes: prunedNodes, edges: prunedEdges };
  }
}