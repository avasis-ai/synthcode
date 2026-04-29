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

export interface CapabilityNode {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, unknown>;
}

export interface DependencyEdge {
  fromCapabilityId: string;
  toCapabilityId: string;
  dependencyType: "requires" | "uses" | "is_prerequisite_for";
  strength: number;
  metadata: Record<string, unknown>;
}

export interface CapabilityGraphPayload {
  nodes: CapabilityNode[];
  edges: DependencyEdge[];
}

export interface GraphVisualizerState {
  payload: CapabilityGraphPayload | null;
  isLoading: boolean;
  error: string | null;
}

export class ToolCapabilityDependencyGraphVisualizer {
  private state: GraphVisualizerState;

  constructor(initialState: GraphVisualizerState = {
    payload: null,
    isLoading: false,
    error: null,
  }) {
    this.state = initialState;
  }

  public updateState(newState: Partial<GraphVisualizerState>): void {
    this.state = { ...this.state, ...newState };
  }

  public getGraphState(): GraphVisualizerState {
    return this.state;
  }

  private validatePayload(payload: CapabilityGraphPayload): boolean {
    if (!payload || !payload.nodes || !payload.edges) {
      return false;
    }
    const nodeIds = new Set(payload.nodes.map((n) => n.id));
    for (const edge of payload.edges) {
      if (!nodeIds.has(edge.fromCapabilityId) || !nodeIds.has(edge.toCapabilityId)) {
        console.error("Invalid edge references in payload:", edge);
        return false;
      }
    }
    return true;
  }

  public processAndVisualize(payload: CapabilityGraphPayload): {
    isValid: boolean;
    visualComponents: {
      nodes: any[];
      edges: any[];
    };
  } {
    if (!this.validatePayload(payload)) {
      return {
        isValid: false,
        visualComponents: { nodes: [], edges: [] },
      };
    }

    const nodes = payload.nodes.map((node) => ({
      id: node.id,
      label: node.name,
      details: node.description,
      style: { size: 10 + node.metadata.depth || 1, color: node.metadata.priority ? 'blue' : 'gray' },
    }));

    const edges = payload.edges.map((edge) => ({
      source: edge.fromCapabilityId,
      target: edge.toCapabilityId,
      type: edge.dependencyType,
      weight: edge.strength,
      style: { opacity: edge.strength / 5, strokeWidth: edge.strength * 0.5 },
    }));

    return {
      isValid: true,
      visualComponents: { nodes, edges },
    };
  }

  public renderVisualization(payload: CapabilityGraphPayload): void {
    this.updateState({
      payload: payload,
      isLoading: false,
      error: null,
    });

    const result = this.processAndVisualize(payload);

    if (!result.isValid) {
      this.updateState({
        error: "Failed to process graph payload: Missing or invalid node/edge references.",
      });
      return;
    }

    console.log("Graph Visualization Ready:", {
      nodes: result.visualComponents.nodes,
      edges: result.visualComponents.edges,
    });
    // In a real implementation, this would trigger a rendering engine update (e.g., D3, React component update)
  }
}