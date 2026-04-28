import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface SemanticContextGraph {
  nodes: Map<string, { content: ContentBlock[]; timestamp: number }>;
  edges: Set<string>; // Represents connections between node IDs
}

export interface FocusContext {
  focusContent: ContentBlock[];
  focusSourceId: string;
}

export interface PruningReport {
  removedNodes: Map<string, string>; // Node ID -> Reason
  removedEdges: Set<string>;
  totalRemovedItems: number;
}

export class SemanticContextGraphPrunerV7 {
  private readonly DEFAULT_DECAY_RATE = 0.01;

  private calculateSemanticDistance(nodeContent: ContentBlock[], focusContent: ContentBlock[]): number {
    // Placeholder for actual semantic similarity calculation (e.g., embedding cosine distance)
    // For this implementation, we simulate distance based on content overlap/length difference.
    let totalFocusLength = focusContent.reduce((acc, block) => acc + (block.type === "text" ? block.text.length : 0), 0);
    let totalNodeLength = nodeContent.reduce((acc, block) => acc + (block.type === "text" ? block.text.length : 0), 0);

    if (totalFocusLength === 0 && totalNodeLength === 0) return 1.0;
    if (totalFocusLength === 0) return 0.5;
    if (totalNodeLength === 0) return 0.5;

    // Simple heuristic: closer to 1 means higher perceived relevance/similarity
    return Math.min(1.0, 1.0 - Math.abs(totalFocusLength - totalNodeLength) / Math.max(1, totalFocusLength, totalNodeLength));
  }

  private calculateDecayScore(timestamp: number, decayRate: number): number {
    const currentTime = Date.now();
    const timeElapsed = currentTime - timestamp;
    // Exponential decay: e^(-rate * time)
    return Math.exp(-decayRate * (timeElapsed / 1000));
  }

  private scoreNode(nodeId: string, node: { content: ContentBlock[]; timestamp: number }, focus: FocusContext, decayRate: number): number {
    const semanticScore = this.calculateSemanticDistance(node.content, focus.focusContent);
    const decayScore = this.calculateDecayScore(node.timestamp, decayRate);
    // Combined score: Relevance * Decay
    return semanticScore * decayScore;
  }

  private scoreEdge(edgeId: string, sourceNodeId: string, targetNodeId: string, focus: FocusContext, decayRate: number): number {
    // Edge relevance is often derived from the semantic relationship between the two nodes.
    // Here, we approximate by averaging the scores of the connected nodes.
    const sourceNode = { content: [], timestamp: 0 }; // Mock retrieval
    const targetNode = { content: [], timestamp: 0 }; // Mock retrieval

    const sourceScore = this.scoreNode(sourceNodeId, sourceNode, focus, decayRate);
    const targetScore = this.scoreNode(targetNodeId, targetNode, focus, decayRate);

    return (sourceScore + targetScore) / 2.0;
  }

  public prune(graph: SemanticContextGraph, focus: FocusContext, decayRate: number): { prunedGraph: SemanticContextGraph, report: PruningReport } {
    const nodesToKeep = new Set<string>();
    const edgesToKeep = new Set<string>();
    const report: PruningReport = {
      removedNodes: new Map(),
      removedEdges: new Set(),
      totalRemovedItems: 0,
    };

    // 1. Score Nodes
    const nodeScores: Map<string, number> = new Map();
    for (const [id, node] of graph.nodes.entries()) {
      const score = this.scoreNode(id, node, focus, decayRate);
      nodeScores.set(id, score);
    }

    // Determine a threshold (e.g., keep top 70% or nodes above a calculated median/average)
    const scoresArray = Array.from(nodeScores.entries()).map(([id, score]) => ({ id, score }));
    scoresArray.sort((a, b) => b.score - a.score);

    // Keep nodes above the 30th percentile score (a heuristic threshold)
    const thresholdIndex = Math.floor(scoresArray.length * 0.3);
    const relevanceThreshold = scoresArray[thresholdIndex]?.score ?? 0.1;

    for (const [id, score] of nodeScores.entries()) {
      if (score >= relevanceThreshold) {
        nodesToKeep.add(id);
      } else {
        report.removedNodes.set(id, `Score ${score.toFixed(3)} below threshold ${relevanceThreshold.toFixed(3)}`);
        report.totalRemovedItems++;
      }
    }

    // 2. Score and Prune Edges
    for (const edgeId of graph.edges) {
      // Assuming edgeId format allows extraction of source/target IDs, e.g., "A->B"
      const parts = edgeId.split("->");
      if (parts.length !== 2) continue;
      const sourceId = parts[0];
      const targetId = parts[1];

      const score = this.scoreEdge(edgeId, sourceId, targetId, focus, decayRate);

      if (score >= relevanceThreshold * 0.9) { // Edges require slightly lower threshold
        edgesToKeep.add(edgeId);
      } else {
        report.removedEdges.add(edgeId);
        report.totalRemovedItems++;
      }
    }

    // 3. Construct Pruned Graph
    const prunedNodes = new Map<string, { content: ContentBlock[]; timestamp: number }>();
    for (const id of nodesToKeep) {
      const node = graph.nodes.get(id)!;
      prunedNodes.set(id, node);
    }

    const prunedGraph: SemanticContextGraph = {
      nodes: prunedNodes,
      edges: edgesToKeep,
    };

    return {
      prunedGraph,
      report,
    };
  }
}