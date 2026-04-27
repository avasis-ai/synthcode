import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type TemporalEdge = {
  source: string;
  target: string;
  startTime: number;
  endTime: number;
  weight?: number;
};

export interface GraphNode {
  id: string;
  label: string;
  // Could include other static properties like type, metadata, etc.
}

export interface TemporalGraph {
  nodes: GraphNode[];
  edges: TemporalEdge[];
}

export class DependencyGraphVisualizerV5 {
  private graph: TemporalGraph;

  constructor(initialGraph: TemporalGraph) {
    this.graph = initialGraph;
  }

  public visualize(): {
    layoutData: {
      nodes: GraphNode[];
      edges: {
        source: string;
        target: string;
        startTime: number;
        endTime: number;
        // For Gantt-like rendering, we might need calculated positions
        xStart: number;
        xEnd: number;
        yPosition: number;
      }[];
    };
    renderingInstructions: string;
  } {
    const nodes = this.graph.nodes;
    const edges = this.graph.edges;

    // Simple layout simulation: Assign vertical positions based on node index
    const nodeMap = new Map<string, { yPosition: number }>();
    nodes.forEach((node, index) => {
      nodeMap.set(node.id, { yPosition: index * 50 });
    });

    // Simulate time-based layout calculation (Gantt style)
    const layoutEdges = edges.map(edge => {
      const sourcePos = nodeMap.get(edge.source)!;
      const targetPos = nodeMap.get(edge.target)!;

      // For visualization, we use the time window directly for horizontal scaling
      return {
        source: edge.source,
        target: edge.target,
        startTime: edge.startTime,
        endTime: edge.endTime,
        xStart: edge.startTime,
        xEnd: edge.endTime,
        yPosition: sourcePos.yPosition, // Use source Y for simplicity in this simulation
      };
    });

    const layoutData = {
      nodes: nodes,
      edges: layoutEdges,
    };

    const renderingInstructions = `
      Rendering Mode: Temporal/Gantt Style.
      Visualize nodes vertically (Y-axis spacing).
      Visualize edges horizontally based on time (X-axis: ${Math.min(...edges.map(e => e.startTime))}-${Math.max(...edges.map(e => e.endTime))}).
      Each edge represents an activity spanning from time ${e.startTime} to ${e.endTime}.
    `;

    return {
      layoutData,
      renderingInstructions,
    };
  }
}