import { Graph, Node, Edge } from "./graph-types";

type SemanticSimilarity = number;

interface NodeDiff {
  nodeId: string;
  type: "added" | "removed" | "modified";
  details?: {
    oldContent?: any;
    newContent?: any;
    similarity?: SemanticSimilarity;
  };
}

interface EdgeDiff {
  edgeId: string;
  type: "added" | "removed" | "modified";
  details?: {
    sourceId: string;
    targetId: string;
    oldWeight?: number;
    newWeight?: number;
    similarity?: SemanticSimilarity;
  };
}

interface SemanticGraphDiff {
  nodeDiffs: NodeDiff[];
  edgeDiffs: EdgeDiff[];
}

export class SemanticContextGraphDiffer {
  private readonly similarityThreshold: number;

  constructor(similarityThreshold: number = 0.7) {
    this.similarityThreshold = similarityThreshold;
  }

  private extractGraphMetadata(graph: Graph): { nodes: Map<string, Node>; edges: Map<string, Edge> } {
    const nodes = new Map<string, Node>();
    for (const node of graph.nodes) {
      nodes.set(node.id, node);
    }

    const edges = new Map<string, Edge>();
    for (const edge of graph.edges) {
      edges.set(edge.id, edge);
    }

    return { nodes, edges };
  }

  private calculateNodeSimilarity(nodeA: Node, nodeB: Node): SemanticSimilarity {
    // Placeholder for actual embedding comparison (e.g., cosine similarity)
    // In a real scenario, node.content would be embedded and compared.
    if (!nodeA.content || !nodeB.content) return 0;
    const contentA = nodeA.content.toLowerCase();
    const contentB = nodeB.content.toLowerCase();
    if (contentA === contentB) return 1.0;
    
    // Simple heuristic for demonstration: based on shared unique words
    const wordsA = new Set(contentA.split(/\s+/).filter(w => w.length > 1));
    const wordsB = new Set(contentB.split(/\s+/).filter(w => w.length > 1));
    let intersectionCount = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) {
        intersectionCount++;
      }
    }
    const unionSize = new Set([...wordsA, ...wordsB]).size;
    return Math.min(1.0, intersectionCount / Math.max(1, Math.sqrt(wordsA.size * wordsB.size)) * 2);
  }

  private compareNodes(oldNodes: Map<string, Node>, newNodes: Map<string, Node>): NodeDiff[] {
    const diffs: NodeDiff[] = [];
    const oldIds = new Set(oldNodes.keys());
    const newIds = new Set(newNodes.keys());

    // Check for removals and modifications
    for (const oldId of oldIds) {
      const oldNode = oldNodes.get(oldId)!;
      const comparableNewNode = newNodes.get(oldId);

      if (!comparableNewNode) {
        diffs.push({ nodeId: oldId, type: "removed" });
        continue;
      }

      const similarity = this.calculateNodeSimilarity(oldNode, comparableNewNode);
      
      if (similarity < this.similarityThreshold) {
        diffs.push({ 
          nodeId: oldId, 
          type: "modified", 
          details: { 
            oldContent: oldNode.content, 
            newContent: comparableNewNode.content, 
            similarity: similarity 
          } 
        });
      }
      // If similarity is high, we treat it as unchanged (no diff reported)
    }

    // Check for additions
    for (const newId of newIds) {
      if (!oldNodes.has(newId)) {
        diffs.push({ nodeId: newId, type: "added" });
      }
    }

    return diffs;
  }

  private compareEdges(oldEdges: Map<string, Edge>, newEdges: Map<string, Edge>): EdgeDiff[] {
    const diffs: EdgeDiff[] = [];
    const oldIds = new Set(oldEdges.keys());
    const newIds = new Set(newEdges.keys());

    // Check for removals and modifications
    for (const oldId of oldIds) {
      const oldEdge = oldEdges.get(oldId)!;
      const comparableNewEdge = newEdges.get(oldId);

      if (!comparableNewEdge) {
        diffs.push({ edgeId: oldId, type: "removed" });
        continue;
      }

      // Edge modification check (e.g., weight change)
      const weightDiff = Math.abs(oldEdge.weight - comparableNewEdge.weight);
      if (weightDiff > 0.1) { // Arbitrary threshold for weight change
        diffs.push({ 
          edgeId: oldId, 
          type: "modified", 
          details: { 
            sourceId: oldEdge.sourceId, 
            targetId: oldEdge.targetId, 
            oldWeight: oldEdge.weight, 
            newWeight: comparableNewEdge.weight, 
            similarity: 1.0 - (weightDiff / Math.max(1, Math.abs(oldEdge.weight) + Math.abs(comparableNewEdge.weight)))
          } 
        });
      }
    }

    // Check for additions
    for (const newId of newIds) {
      if (!oldEdges.has(newId)) {
        diffs.push({ edgeId: newId, type: "added" });
      }
    }

    return diffs;
  }

  public computeDiff(oldGraph: Graph, newGraph: Graph): SemanticGraphDiff {
    const { nodes: oldNodes, edges: oldEdges } = this.extractGraphMetadata(oldGraph);
    const { nodes: newNodes, edges: newEdges } = this.extractGraphMetadata(newGraph);

    const nodeDiffs = this.compareNodes(oldNodes, newNodes);
    const edgeDiffs = this.compareEdges(oldEdges, newEdges);

    return {
      nodeDiffs,
      edgeDiffs,
    };
  }
}