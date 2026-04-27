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

export interface TemporalMetadata {
  startTime: number;
  endTime: number;
  durationMs: number;
}

export interface ResourceConstraint {
  resourceId: string;
  requiredAmount: number;
  availableAmount: number;
}

export interface DependencyEdge {
  sourceMessageId: string;
  targetMessageId: string;
  temporalMetadata?: TemporalMetadata;
  resourceConstraints?: ResourceConstraint[];
}

export interface GraphNode {
  messageId: string;
  message: Message;
}

export interface DependencyGraphData {
  nodes: GraphNode[];
  edges: DependencyEdge[];
}

export class ToolExecutionDependencyGraphVisualizerV39 {
  private graphData: DependencyGraphData;

  constructor(graphData: DependencyGraphData) {
    this.graphData = graphData;
  }

  public visualize(): {
    nodes: any[];
    edges: any[];
    layoutHints: Record<string, { x: number; y: number }>;
  } {
    const nodes = this.graphData.nodes.map(node => ({
      id: node.messageId,
      label: this.formatNodeLabel(node.message),
      // Placeholder for visual representation data
      data: {
        type: "message",
        content: node.message,
      },
    }));

    const edges = this.graphData.edges.map(edge => ({
      source: edge.sourceMessageId,
      target: edge.targetMessageId,
      // Visual representation based on metadata
      style: this.getEdgeStyle(edge),
      data: {
        temporal: edge.temporalMetadata,
        resources: edge.resourceConstraints,
      },
    }));

    const layoutHints: Record<string, { x: number; y: number }> = this.calculateLayoutHints(nodes);

    return { nodes, edges, layoutHints };
  }

  private formatNodeLabel(message: Message): string {
    if ("user" === message.role) {
      return `User: ${message.content.substring(0, 30)}...`;
    }
    if ("assistant" === message.role) {
      return `Assistant: ${message.content.substring(0, 30)}...`;
    }
    if ("tool" === message.role) {
      return `Tool Result: ${message.content.substring(0, 30)}...`;
    }
    return "Unknown Message";
  }

  private getEdgeStyle(edge: DependencyEdge): { color: string; width: number; hasConstraint: boolean } {
    let color = "#999";
    let width = 1.0;
    let hasConstraint = false;

    if (edge.resourceConstraints && edge.resourceConstraints.length > 0) {
      color = "#FF6347"; // Tomato for resource constraints
      width = 2.0;
      hasConstraint = true;
    } else if (edge.temporalMetadata) {
      color = "#4682B4"; // SteelBlue for temporal flow
      width = 1.5;
    } else {
      color = "#6A5ACD"; // SlateBlue for default dependency
    }

    return { color, width, hasConstraint };
  }

  private calculateLayoutHints(nodes: any[]): Record<string, { x: number; y: number }> {
    const hints: Record<string, { x: number; y: number }> = {};
    // Simple deterministic layout simulation based on index for demonstration
    nodes.forEach((node, index) => {
      hints[node.id] = {
        x: (index % 5) * 150,
        y: Math.floor(index / 5) * 100,
      };
    });
    return hints;
  }
}