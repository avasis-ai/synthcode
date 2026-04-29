import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ResourceUsage {
  resourceName: string;
  amount: number;
  unit: string;
}

export interface TemporalConstraint {
  startTimeMs: number;
  endTimeMs: number;
  dependency?: string; // ID of the preceding node/tool
}

export interface ToolNodePayload {
  toolName: string;
  toolId: string;
  input: Record<string, unknown>;
  executionTimeMs: number;
  resourceUsage: ResourceUsage[];
  temporalConstraints: TemporalConstraint[];
}

export interface DependencyEdgePayload {
  fromToolId: string;
  toToolId: string;
  dependencyType: "CALL" | "DATA_FLOW" | "TEMPORAL";
  weight: number; // e.g., data size or time delay
  temporalConstraint?: TemporalConstraint;
}

export interface GraphPayload {
  nodes: ToolNodePayload[];
  edges: DependencyEdgePayload[];
}

export class ToolExecutionDependencyGraphVisualizer {
  private graphPayload: GraphPayload;

  constructor(payload: GraphPayload) {
    this.graphPayload = payload;
  }

  private processNode(node: ToolNodePayload): any {
    const nodeData: any = {
      id: node.toolId,
      label: node.toolName,
      details: {
        executionTime: `${node.executionTimeMs}ms`,
        resources: node.resourceUsage.map(r => `${r.amount}${r.unit}/${r.resourceName}`).join(", "),
        constraints: node.temporalConstraints.map(c => `[${c.startTimeMs}-${c.endTimeMs}]`).join(", "),
      },
      // Placeholder for actual rendering logic hooks
    };
    return nodeData;
  }

  private processEdge(edge: DependencyEdgePayload): any {
    let edgeType = edge.dependencyType;
    let weightDisplay = `${edge.weight.toFixed(2)}`;

    if (edge.dependencyType === "TEMPORAL" && edge.temporalConstraint) {
      edgeType = "TIME_LINK";
      weightDisplay = `Duration: ${edge.temporalConstraint.endTimeMs - edge.temporalConstraint.startTimeMs}ms`;
    } else if (edge.dependencyType === "DATA_FLOW") {
      edgeType = "DATA_LINK";
    }

    return {
      source: edge.fromToolId,
      target: edge.toToolId,
      type: edgeType,
      weight: weightDisplay,
    };
  }

  public visualize(): { nodes: any[]; edges: any[] } {
    const processedNodes = this.graphPayload.nodes.map(this.processNode);
    const processedEdges = this.graphPayload.edges.map(this.processEdge);

    return {
      nodes: processedNodes,
      edges: processedEdges,
    };
  }
}