import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

interface Node {
  id: string;
  type: string;
  properties: Record<string, unknown>;
  embedding: Float32Array;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, unknown>;
  embedding: Float32Array;
}

interface GraphPayload {
  nodes: Record<string, Node>;
  edges: Record<string, Edge>;
}

interface DiffNode {
  id: string;
  node: Node;
  status: "added" | "removed" | "modified";
  similarity: number;
  details: {
    originalProperties?: Record<string, unknown>;
    newProperties?: Record<string, unknown>;
  };
}

interface DiffEdge {
  id: string;
  edge: Edge;
  status: "added" | "removed" | "modified";
  similarity: number;
  details: {
    originalProperties?: Record<string, unknown>;
    newProperties?: Record<string, unknown>;
  };
}

interface GraphDiffPayload {
  nodes: DiffNode[];
  edges: DiffEdge[];
}

export class SemanticContextGraphDiffer {
  private readonly similarityThreshold: number;

  constructor(similarityThreshold: number = 0.8) {
    this.similarityThreshold = similarityThreshold;
  }

  private calculateSimilarity(vecA: Float32Array, vecB: Float32Array): number {
    if (vecA.length !== vecB.length) {
      return 0.0;
    }
    let dotProduct = 0.0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
    }
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    if (magnitudeA === 0 || magnitudeB === 0) return 0.0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private compareNodes(
    graphA: GraphPayload,
    graphB: GraphPayload
  ): DiffNode[] {
    const diffNodes: DiffNode[] = [];
    const nodesA = graphA.nodes;
    const nodesB = graphB.nodes;

    // 1. Check for modifications and additions in B relative to A
    for (const idB in nodesB) {
      const nodeB = nodesB[idB];
      let bestMatchIdA: string | null = null;
      let maxSimilarity = -1.0;

      for (const idA in nodesA) {
        const nodeA = nodesA[idA];
        const similarity = this.calculateSimilarity(nodeA.embedding, nodeB.embedding);

        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          bestMatchIdA = idA;
        }
      }

      if (bestMatchIdA && maxSimilarity >= this.similarityThreshold) {
        const nodeA = nodesA[bestMatchIdA];
        const isModified = JSON.stringify(nodeA.properties) !== JSON.stringify(nodeB.properties);
        
        diffNodes.push({
          id: idB,
          node: nodeB,
          status: isModified ? "modified" : "added",
          similarity: maxSimilarity,
          details: {
            originalProperties: nodeA.properties,
            newProperties: nodeB.properties,
          },
        });
      } else {
        // Assume added if no strong match found (or if we treat all unmatched as new)
        diffNodes.push({
          id: idB,
          node: nodeB,
          status: "added",
          similarity: 0.0,
          details: { newProperties: nodeB.properties },
        });
      }
    }

    // 2. Check for deletions (Nodes in A but not strongly matched in B)
    for (const idA in nodesA) {
      const nodeA = nodesA[idA];
      let isDeleted = true;
      
      for (const idB in nodesB) {
        const nodeB = nodesB[idB];
        const similarity = this.calculateSimilarity(nodeA.embedding, nodeB.embedding);
        
        if (similarity >= this.similarityThreshold) {
          isDeleted = false;
          break;
        }
      }

      if (isDeleted) {
        diffNodes.push({
          id: idA,
          node: nodeA,
          status: "removed",
          similarity: 0.0,
          details: { originalProperties: nodeA.properties },
        });
      }
    }

    return diffNodes;
  }

  private compareEdges(
    graphA: GraphPayload,
    graphB: GraphPayload
  ): DiffEdge[] {
    const diffEdges: DiffEdge[] = [];
    const edgesA = graphA.edges;
    const edgesB = graphB.edges;

    // Simplified comparison: Iterate over B and check for matches/additions
    for (const idB in edgesB) {
      const edgeB = edgesB[idB];
      let bestMatchIdA: string | null = null;
      let maxSimilarity = -1.0;

      for (const idA in edgesA) {
        const edgeA = edgesA[idA];
        const similarity = this.calculateSimilarity(edgeA.embedding, edgeB.embedding);

        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          bestMatchIdA = idA;
        }
      }

      if (bestMatchIdA && maxSimilarity >= this.similarityThreshold) {
        const edgeA = edgesA[bestMatchIdA];
        const isModified = JSON.stringify(edgeA.properties) !== JSON.stringify(edgeB.properties);
        
        diffEdges.push({
          id: idB,
          edge: edgeB,
          status: isModified ? "modified" : "added",
          similarity: maxSimilarity,
          details: {
            originalProperties: edgeA.properties,
            newProperties: edgeB.properties,
          },
        });
      } else {
        diffEdges.push({
          id: idB,
          edge: edgeB,
          status: "added",
          similarity: 0.0,
          details: { newProperties: edgeB.properties },
        });
      }
    }

    // Check for deletions
    for (const idA in edgesA) {
      const edgeA = edgesA[idA];
      let isDeleted = true;
      
      for (const idB in edgesB) {
        const edgeB = edgesB[idB];
        const similarity = this.calculateSimilarity(edgeA.embedding, edgeB.embedding);
        
        if (similarity >= this.similarityThreshold) {
          isDeleted = false;
          break;
        }
      }

      if (isDeleted) {
        diffEdges.push({
          id: idA,
          edge: edgeA,
          status: "removed",
          similarity: 0.0,
          details: { originalProperties: edgeA.properties },
        });
      }
    }

    return diffEdges;
  }

  public generateDiffReport(
    graphA: GraphPayload,
    graphB: GraphPayload
  ): {
    diff: GraphDiffPayload;
    overallDivergenceScore: number;
  } {
    const nodeDiffs = this.compareNodes(graphA, graphB);
    const edgeDiffs = this.compareEdges(graphA, graphB);

    const diffReport: GraphDiffPayload = {
      nodes: nodeDiffs,
      edges: edgeDiffs,
    };

    const totalChanges = nodeDiffs.length + edgeDiffs.length;
    let totalSimilaritySum = 0;
    let weightedChangeCount = 0;

    nodeDiffs.forEach(diff => {
      totalSimilaritySum += diff.similarity;
      weightedChangeCount += 1;
    });
    edgeDiffs.forEach(diff => {
      totalSimilaritySum += diff.similarity;
      weightedChangeCount += 1;
    });

    const overallDivergenceScore = weightedChangeCount > 0 ? totalSimilaritySum / weightedChangeCount : 0.0;

    return {
      diff: diffReport,
      overallDivergenceScore: overallDivergenceScore,
    };
  }
}