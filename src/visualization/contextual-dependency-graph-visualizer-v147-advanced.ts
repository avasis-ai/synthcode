import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type GraphNode = {
  id: string;
  label: string;
  type: "tool" | "user" | "system";
  metadata: Record<string, unknown>;
};

export type GraphEdge = {
  source: string;
  target: string;
  type: "dependency" | "temporal" | "resource";
  weight: number;
  metadata: Record<string, unknown>;
};

export interface TemporalConstraint {
  start: number;
  end: number;
  description: string;
}

export interface ResourceConstraint {
  resourceId: string;
  requiredAmount: number;
  scope: "global" | "local";
}

export interface ContextualGraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
  temporalConstraints: TemporalConstraint[];
  resourceConstraints: ResourceConstraint[];
}

export class ContextualDependencyGraphVisualizerAdvanced {
  private payload: ContextualGraphPayload;

  constructor(payload: ContextualGraphPayload) {
    this.payload = payload;
  }

  public visualize(): {
    visualElements: any[];
    summary: string;
  } {
    const { nodes, edges, temporalConstraints, resourceConstraints } = this.payload;

    const nodeVisuals: any[] = nodes.map((node: GraphNode) => ({
      type: "node",
      id: node.id,
      label: node.label,
      style: {
        backgroundColor: node.type === "tool" ? "#ADD8E6" : node.type === "user" ? "#90EE90" : "#D3D3D3",
      },
    }));

    const edgeVisuals: any[] = edges.map((edge: GraphEdge) => ({
      type: "edge",
      source: edge.source,
      target: edge.target,
      style: {
        stroke: edge.type === "dependency" ? "#00008B" : edge.type === "temporal" ? "#FF4500" : "#FFD700",
        strokeWidth: edge.weight * 1.5,
      },
      metadata: edge.metadata,
    }));

    const temporalVisuals: any[] = temporalConstraints.map((tc: TemporalConstraint) => ({
      type: "temporal_overlay",
      start: tc.start,
      end: tc.end,
      description: tc.description,
      style: {
        backgroundColor: "rgba(255, 69, 0, 0.2)",
      },
    }));

    const resourceVisuals: any[] = resourceConstraints.map((rc: ResourceConstraint) => ({
      type: "resource_overlay",
      resourceId: rc.resourceId,
      requiredAmount: rc.requiredAmount,
      scope: rc.scope,
      style: {
        border: `2px dashed ${rc.scope === "global" ? "red" : "blue"}`,
      },
    }));

    const visualElements = [
      ...nodeVisuals,
      ...edgeVisuals,
      ...temporalVisuals,
      ...resourceVisuals,
    ];

    const summary = `Visualization generated successfully. Nodes: ${nodes.length}, Edges: ${edges.length}, Temporal Constraints: ${temporalConstraints.length}, Resource Constraints: ${resourceConstraints.length}.`;

    return {
      visualElements,
      summary,
    };
  }
}