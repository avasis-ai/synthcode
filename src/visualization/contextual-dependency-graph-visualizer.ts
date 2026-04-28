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

interface DependencyGraph {
  nodes: Record<string, { id: string; label: string; metadata: Record<string, unknown> }>;
  edges: { source: string; target: string; weight: number }[];
}

interface Context {
  query: string;
  lastOutput?: string;
}

interface VisualizationConfig {
  baseGraph: DependencyGraph;
  context: Context;
}

interface VisualizerState {
  graph: DependencyGraph;
  context: Context;
  nodeScores: Record<string, number>;
  edgeScores: Record<string, number>;
}

export class ContextualDependencyGraphVisualizer {
  private state: VisualizerState;

  constructor(initialGraph: DependencyGraph, initialContext: Context) {
    this.state = {
      graph: initialGraph,
      context: initialContext,
      nodeScores: {},
      edgeScores: {},
    };
  }

  private calculateNodeScore(nodeId: string, context: Context): number {
    const node = this.state.graph.nodes[nodeId];
    if (!node) return 0;

    let score = 0;
    const queryMatch = (context.query || "").toLowerCase();
    const labelLower = node.label.toLowerCase();

    if (labelLower.includes(queryMatch)) {
      score += 0.8;
    }

    // Simple heuristic: nodes with more metadata might be more complex/important
    score += Math.min(0.5, Object.keys(node.metadata).length * 0.1);

    // Placeholder for advanced context integration (e.g., checking if metadata matches lastOutput)
    if (context.lastOutput && labelLower.includes(context.lastOutput.toLowerCase())) {
      score += 1.0;
    }

    return Math.max(0.1, score);
  }

  private calculateEdgeScore(sourceId: string, targetId: string, context: Context): number {
    const edges = this.state.graph.edges.filter(e =>
      (e.source === sourceId && e.target === targetId) ||
      (e.source === targetId && e.target === sourceId)
    );

    if (edges.length === 0) return 0;

    // Edge relevance is often derived from the relevance of its endpoints
    const sourceScore = this.calculateNodeScore(sourceId, context);
    const targetScore = this.calculateNodeScore(targetId, context);

    // Weight the edge score by the geometric mean of its endpoints' scores
    return Math.sqrt(sourceScore * targetScore) * (0.5 + Math.random() * 0.5);
  }

  private calculateAllScores(context: Context): { nodeScores: Record<string, number>; edgeScores: Record<string, number> } {
    const nodeScores: Record<string, number> = {};
    const edgeScores: Record<string, number> = {};

    // 1. Calculate Node Scores
    for (const nodeId in this.state.graph.nodes) {
      nodeScores[nodeId] = this.calculateNodeScore(nodeId, context);
    }

    // 2. Calculate Edge Scores
    for (const edge of this.state.graph.edges) {
      const score = this.calculateEdgeScore(edge.source, edge.target, context);
      const edgeKey = `${edge.source}-${edge.target}`;
      edgeScores[edgeKey] = score;
    }

    return { nodeScores, edgeScores };
  }

  public updateContext(newContext: Context): void {
    const { nodeScores, edgeScores } = this.calculateAllScores(newContext);

    this.state = {
      graph: this.state.graph,
      context: newContext,
      nodeScores: nodeScores,
      edgeScores: edgeScores,
    };
  }

  public getVisualizationData(): {
    nodes: Record<string, { id: string; label: string; score: number }>;
    edges: { source: string; target: string; score: number }[];
    config: {
      nodeScores: Record<string, number>;
      edgeScores: Record<string, number>;
    };
  } {
    const nodesOutput: Record<string, { id: string; label: string; score: number }> = {};
    const edgesOutput: { source: string; target: string; score: number }[] = [];

    for (const id in this.state.graph.nodes) {
      const node = this.state.graph.nodes[id];
      nodesOutput[id] = {
        id: node.id,
        label: node.label,
        score: this.state.nodeScores[id] || 0,
      };
    }

    for (const edge of this.state.graph.edges) {
      const edgeKey = `${edge.source}-${edge.target}`;
      edgesOutput.push({
        source: edge.source,
        target: edge.target,
        score: this.state.edgeScores[edgeKey] || 0,
      });
    }

    return {
      nodes: nodesOutput,
      edges: edgesOutput,
      config: {
        nodeScores: this.state.nodeScores,
        edgeScores: this.state.edgeScores,
      },
    };
  }
}