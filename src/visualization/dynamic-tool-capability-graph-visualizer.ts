import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type CapabilityNode = {
  id: string;
  name: string;
  description: string;
};

export type CapabilityEdge = {
  source: string;
  target: string;
  relationship: "requires" | "derives" | "uses";
  context: string;
};

export interface CapabilityGraphPayload {
  nodes: CapabilityNode[];
  edges: CapabilityEdge[];
}

export class DynamicToolCapabilityGraphVisualizer {
  private payload: CapabilityGraphPayload;

  constructor(payload: CapabilityGraphPayload) {
    this.payload = payload;
  }

  private validatePayload(): boolean {
    if (!this.payload.nodes || !this.payload.edges) {
      return false;
    }
    const nodeIds = new Set(this.payload.nodes.map((n) => n.id));
    for (const edge of this.payload.edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        return false;
      }
    }
    return true;
  }

  public getGraphData(): {
    nodes: CapabilityNode[];
    edges: CapabilityEdge[];
  } {
    if (!this.validatePayload()) {
      throw new Error("Invalid CapabilityGraphPayload provided.");
    }
    return {
      nodes: this.payload.nodes,
      edges: this.payload.edges,
    };
  }

  public getVisualizationMetadata(): {
    layoutHints: Record<string, { x: number; y: number }>;
    summary: string;
  } {
    const nodeCount = this.payload.nodes.length;
    const edgeCount = this.payload.edges.length;
    const summary = `Graph contains ${nodeCount} capabilities and ${edgeCount} relationships.`;

    // Simple placeholder layout generation for demonstration
    const layoutHints: Record<string, { x: number; y: number }> = {};
    this.payload.nodes.forEach((node, index) => {
      layoutHints[node.id] = {
        x: (index % 5) * 100,
        y: Math.floor(index / 5) * 50,
      };
    });

    return {
      layoutHints,
      summary,
    };
  }

  public visualize(): void {
    const data = this.getGraphData();
    const metadata = this.getVisualizationMetadata();

    console.log("--- Graph Visualization Report ---");
    console.log("Summary:", metadata.summary);
    console.log("Layout Hints (for rendering engine):", metadata.layoutHints);
    console.log("Nodes:", data.nodes);
    console.log("Edges:", data.edges);
    // In a real implementation, this would call a rendering library (e.g., D3, React Flow)
  }
}