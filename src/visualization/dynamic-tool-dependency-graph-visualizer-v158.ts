import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type GraphNode = {
  id: string;
  label: string;
  type: "tool" | "context" | "user_input";
  metadata: Record<string, unknown>;
};

export type GraphEdge = {
  sourceId: string;
  targetId: string;
  type: "calls" | "depends_on" | "flows_to";
  weight: number;
  metadata: Record<string, unknown>;
};

export interface GraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    timestamp: number;
    source: string;
    graphType: "capability" | "resource" | "temporal";
  };
}

export interface FilterState {
  timeWindowStart: number | null;
  timeWindowEnd: number | null;
  resourceConstraint: string | null;
  capabilityType: string | null;
}

export class DynamicToolDependencyGraphVisualizer {
  private payload: GraphPayload;
  private filterState: FilterState;

  constructor(initialPayload: GraphPayload, initialFilterState: FilterState = {
    timeWindowStart: null,
    timeWindowEnd: null,
    resourceConstraint: null,
    capabilityType: null,
  }) {
    this.payload = initialPayload;
    this.filterState = initialFilterState;
  }

  public setPayload(newPayload: GraphPayload): void {
    this.payload = newPayload;
  }

  public setFilterState(newState: FilterState): void {
    this.filterState = newState;
  }

  private filterGraph(payload: GraphPayload, state: FilterState): {
    nodes: GraphNode[];
    edges: GraphEdge[];
  } {
    const filteredNodes: GraphNode[] = payload.nodes.filter(node => {
      if (state.capabilityType && node.metadata.capability !== state.capabilityType) {
        return false;
      }
      return true;
    });

    const filteredEdges: GraphEdge[] = payload.edges.filter(edge => {
      // Simplified filtering logic for demonstration
      return true;
    });

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }

  public renderGraph(renderer: (nodes: GraphNode[], edges: GraphEdge[]) => string): string {
    const { nodes, edges } = this.filterGraph(this.payload, this.filterState);
    return renderer(nodes, edges);
  }
}