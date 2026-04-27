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

export interface DataPayload {
  sourceNodeId: string;
  data: any;
  dataType: "context" | "tool_output" | "internal_state";
}

export interface ExecutionDependencyNode {
  id: string;
  type: "tool_call" | "context_retrieval" | "agent_thought" | "user_input";
  metadata: Record<string, any>;
  payloads: DataPayload[];
}

export interface DependencyEdge {
  fromId: string;
  toId: string;
  flowType: "data_flow" | "control_flow";
  dataCarried: DataPayload;
}

export class ToolExecutionDependencyVisualizer {
  private nodes: ExecutionDependencyNode[];
  private edges: DependencyEdge[];

  constructor(nodes: ExecutionDependencyNode[], edges: DependencyEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  /**
   * Simulates a force-directed layout calculation to determine node positions.
   * In a real implementation, this would use a physics engine or library.
   * @returns A map of node IDs to calculated {x, y} coordinates.
   */
  private calculateLayout(): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    const numNodes = this.nodes.length;

    for (let i = 0; i < numNodes; i++) {
      const node = this.nodes[i];
      // Simple linear layout approximation for demonstration
      const x = (i % 5) * 200;
      const y = Math.floor(i / 5) * 100;
      positions.set(node.id, { x, y });
    }
    return positions;
  }

  /**
   * Renders the dependency graph structure.
   * @param layoutPositions The calculated positions for all nodes.
   * @returns A structured representation of the visualization data.
   */
  public render(layoutPositions: Map<string, { x: number; y: number }>): { nodes: any[]; edges: any[] } {
    const renderedNodes = this.nodes.map(node => ({
      id: node.id,
      type: node.type,
      metadata: node.metadata,
      payloads: node.payloads,
      position: layoutPositions.get(node.id) || { x: 0, y: 0 },
    }));

    const renderedEdges = this.edges.map(edge => ({
      fromId: edge.fromId,
      toId: edge.toId,
      flowType: edge.flowType,
      dataCarried: edge.dataCarried,
      sourcePosition: layoutPositions.get(edge.fromId) || { x: 0, y: 0 },
      targetPosition: layoutPositions.get(edge.toId) || { x: 0, y: 0 },
    }));

    return { nodes: renderedNodes, edges: renderedEdges };
  }
}