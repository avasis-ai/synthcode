import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface FlowEdge {
  sourceId: string;
  targetId: string;
  flowType: "control" | "data";
  weight: number;
}

export interface Node {
  id: string;
  type: "message" | "tool_result" | "thinking";
  content: any;
  metadata: Record<string, any>;
}

export interface ExecutionGraph {
  nodes: Node[];
  edges: FlowEdge[];
}

export class ToolExecutionGraphVisualizerV3 {
  private graph: ExecutionGraph;

  constructor(graph: ExecutionGraph) {
    this.graph = graph;
  }

  private identifyPrimaryPath(nodes: Node[]): string[] {
    if (nodes.length === 0) {
      return [];
    }

    const path: string[] = [];
    let currentNodeId: string | null = null;

    // Simple heuristic: Assume the path follows the order of nodes,
    // prioritizing control flow edges.
    for (const node of nodes) {
      if (currentNodeId === null) {
        path.push(node.id);
        currentNodeId = node.id;
        continue;
      }

      const isConnected = this.graph.edges.some(edge =>
        (edge.sourceId === currentNodeId && edge.targetId === node.id) ||
        (edge.sourceId === node.id && edge.targetId === currentNodeId)
      );

      if (isConnected) {
        path.push(node.id);
        currentNodeId = node.id;
      } else {
        // Break path if connection is lost in sequence
        break;
      }
    }
    return path;
  }

  public visualize(): { primaryPathIds: string[]; flowEdges: FlowEdge[]; } {
    const primaryPathIds = this.identifyPrimaryPath(this.graph.nodes);

    const flowEdges: FlowEdge[] = this.graph.edges.map(edge => {
      let flowType: "control" | "data" = "data";
      let weight: number = 1.0;

      // Heuristic: If the edge connects nodes sequentially in the primary path,
      // or if the edge is explicitly marked as control, treat it as control.
      const isPrimaryFlow = primaryPathIds.includes(edge.sourceId) && primaryPathIds.includes(edge.targetId) &&
                             (primaryPathIds.indexOf(edge.sourceId) < primaryPathIds.indexOf(edge.targetId));

      if (isPrimaryFlow) {
        flowType = "control";
        weight = 1.5;
      } else if (edge.flowType === "control") {
        flowType = "control";
        weight = 1.2;
      }

      return {
        ...edge,
        flowType: flowType,
        weight: weight
      };
    });

    return {
      primaryPathIds: primaryPathIds,
      flowEdges: flowEdges
    };
  }
}