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

export interface TemporalConstraint {
  startTimeMs: number;
  endTimeMs: number;
}

export interface ResourceConstraint {
  resourceId: string;
  requiredCapacity: number;
}

export interface AdvancedEdge {
  sourceId: string;
  targetId: string;
  dependencyType: "CALL" | "DATA_FLOW" | "TEMPORAL_DEPENDENCY";
  constraints: {
    temporal?: TemporalConstraint;
    resource?: ResourceConstraint;
  };
  weight: number;
}

export interface AdvancedNode {
  id: string;
  type: "USER" | "ASSISTANT" | "TOOL_CALL" | "CONTEXTUAL_NODE";
  metadata: Record<string, unknown>;
  // For visualization purposes, might include bounding box or layout hints
  layoutHints?: { x: number; y: number; width: number; height: number };
}

export interface AdvancedGraphPayload {
  nodes: AdvancedNode[];
  edges: AdvancedEdge[];
  messages: Message[];
}

export class ContextualToolCallDependencyGraphVisualizer {
  private payload: AdvancedGraphPayload;

  constructor(payload: AdvancedGraphPayload) {
    this.payload = payload;
  }

  private processAdvancedEdges(edges: AdvancedEdge[]): any[] {
    return edges.map(edge => {
      let edgeData: any = {
        source: edge.sourceId,
        target: edge.targetId,
        type: edge.dependencyType,
        weight: edge.weight,
        style: {
          stroke: "#999",
          strokeWidth: 2,
        },
      };

      if (edge.dependencyType === "TEMPORAL_DEPENDENCY" && edge.constraints.temporal) {
        edgeData.style.stroke = "red";
        edgeData.style.strokeWidth = 3;
        edgeData.temporalWindow = `${edge.constraints.temporal.startTimeMs}ms - ${edge.constraints.temporal.endTimeMs}ms`;
      } else if (edge.dependencyType === "DATA_FLOW" && edge.constraints.resource) {
        edgeData.style.stroke = "blue";
        edgeData.style.strokeWidth = 3;
        edgeData.resourceConstraint = `${edge.constraints.resource.resourceId} (${edge.constraints.resource.requiredCapacity})`;
      }
      return edgeData;
    });
  }

  private processAdvancedNodes(nodes: AdvancedNode[]): any[] {
    return nodes.map(node => {
      let nodeData: any = {
        id: node.id,
        type: node.type,
        metadata: node.metadata,
        style: {
          fill: "#eee",
          stroke: "#333",
        },
      };

      if (node.type === "TOOL_CALL") {
        nodeData.style.fill = "#ffdddd";
        nodeData.label = `Tool Call: ${node.metadata.toolName || 'Unknown'}`;
      } else if (node.type === "CONTEXTUAL_NODE") {
        nodeData.style.fill = "#ddffdd";
        nodeData.label = `Contextual Context (${node.metadata.contextId || 'N/A'})`;
      }
      return nodeData;
    });
  }

  public visualize(): { nodes: any[]; edges: any[] } {
    const processedNodes = this.processAdvancedNodes(this.payload.nodes);
    const processedEdges = this.processAdvancedEdges(this.payload.edges);

    return {
      nodes: processedNodes,
      edges: processedEdges,
    };
  }
}