import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface GraphNode {
  id: string;
  type: string;
  content: Record<string, any>;
  related_nodes: string[];
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
  description: string;
}

interface ContextGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface MergeReport {
  merged: boolean;
  report: string;
  updated_graph: ContextGraph;
}

export class SemanticContextGraphMergerV10 {
  private readonly similarityThreshold: number;

  constructor(similarityThreshold: number = 0.7) {
    this.similarityThreshold = similarityThreshold;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Placeholder for actual embedding similarity calculation (e.g., Cosine Similarity)
    // In a real scenario, this would involve calling an embedding model API.
    // For this implementation, we use a simple heuristic based on shared keywords length.
    const words1 = text1.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const words2 = text2.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    let intersectionCount = 0;
    for (const word of set1) {
      if (set2.has(word)) {
        intersectionCount++;
      }
    }
    const maxWords = Math.max(words1.length, words2.length);
    if (maxWords === 0) return 0.0;
    return intersectionCount / Math.min(words1.length, words2.length) * 0.5 + 0.5; // Scale to [0, 1] range approximation
  }

  private findBestMatch(chunkContent: string, graph: ContextGraph): { node: GraphNode | null, score: number } {
    let bestMatch: { node: GraphNode | null, score: number } = { node: null, score: -1 };

    // Check nodes
    for (const node of graph.nodes) {
      const score = this.calculateSimilarity(chunkContent, JSON.stringify(node.content));
      if (score > bestMatch.score) {
        bestMatch = { node: node, score: score };
      }
    }

    // Check edges (by combining source/target descriptions)
    for (const edge of graph.edges) {
      const combinedDesc = `${edge.source}:${edge.target}:${edge.description}`;
      const score = this.calculateSimilarity(chunkContent, combinedDesc);
      if (score > bestMatch.score) {
        // For simplicity, we'll just report the edge's source node as the best match target
        bestMatch = { node: graph.nodes.find(n => n.id === edge.source) || null, score: score };
      }
    }

    return bestMatch;
  }

  public merge(graph: ContextGraph, newContextChunk: Message): MergeReport {
    const chunkText = this.extractTextFromMessage(newContextChunk);
    if (!chunkText) {
      return { merged: false, report: "Could not extract meaningful text from the context chunk.", updated_graph: graph };
    }

    const { node: bestNode, score: bestScore } = this.findBestMatch(chunkText, graph);

    let updatedGraph: ContextGraph = JSON.parse(JSON.stringify(graph));
    let reportMessage: string;

    if (bestScore >= this.similarityThreshold && bestNode) {
      // Merge Strategy: Update the best matching node
      const nodeIndex = updatedGraph.nodes.findIndex(n => n.id === bestNode.id);
      if (nodeIndex !== -1) {
        const existingNode = updatedGraph.nodes[nodeIndex];
        const mergedContent = { ...existingNode.content, ...this.mergeContent(existingNode.content, chunkText) };
        updatedGraph.nodes[nodeIndex] = {
          ...existingNode,
          content: mergedContent,
        };
        reportMessage = `Successfully merged context into existing node '${bestNode.id}' (Score: ${bestScore.toFixed(3)}).`;
      } else {
        // Should not happen if findBestMatch works correctly, but handle defensively
        return { merged: false, report: `Match found but node ID ${bestNode.id} not in graph structure.`, updated_graph: graph };
      }
    } else {
      // No significant match, treat as new information or append to a general context node
      const newNodeId = `context_${Date.now()}`;
      const newNode: GraphNode = {
        id: newNodeId,
        type: "context_chunk",
        content: { original_text: chunkText, source_message: JSON.stringify(newContextChunk) },
        related_nodes: [],
      };
      updatedGraph.nodes.push(newNode);
      reportMessage = `No strong semantic match found (Best Score: ${bestScore.toFixed(3)}). Added as a new context node '${newNodeId}'.`;
    }

    return {
      merged: true,
      report: reportMessage,
      updated_graph: updatedGraph,
    };
  }

  private extractTextFromMessage(message: Message): string | null {
    if ("content" in message) {
      const contentBlocks = (message as any).content || [];
      let text = "";
      for (const block of contentBlocks) {
        if (block.type === "text" && typeof block.text === 'string') {
          text += block.text;
        }
      }
      return text.trim() || null;
    }
    if (typeof message.content === 'string') {
      return message.content.trim() || null;
    }
    return null;
  }

  private mergeContent(existing: Record<string, any>, newText: string): Record<string, any> {
    // Simple merge: append new text content if it seems like an extension, otherwise overwrite/merge fields.
    if (typeof existing.summary === 'string' && newText.length > 0) {
      return {
        ...existing,
        summary: `${existing.summary} | Context Update: ${newText.substring(0, 100)}...`,
      };
    }
    return {
      ...existing,
      last_update_text: newText,
    };
  }
}