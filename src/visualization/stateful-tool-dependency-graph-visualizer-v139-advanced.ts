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

export interface ToolCallNode {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  startTime: number;
  endTime: number;
  initialState: string;
  finalState: string;
}

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  dependencyType: "CALL" | "DATA_FLOW" | "STATE_TRANSITION";
  startTime: number;
  endTime: number;
  stateTransition?: {
    from: string;
    to: string;
    reason: string;
  };
}

export interface StatefulGraphData {
  nodes: ToolCallNode[];
  edges: DependencyEdge[];
  metadata: {
    lastUpdateTime: number;
    overallState: string;
  };
}

export class StatefulToolDependencyGraphVisualizer {
  private graphData: StatefulGraphData;

  constructor(initialData: StatefulGraphData) {
    this.graphData = initialData;
  }

  public updateData(newData: StatefulGraphData): void {
    this.graphData = newData;
  }

  private getNodeStyle(node: ToolCallNode): { color: string; marker: string } {
    if (node.initialState === node.finalState) {
      return { color: "#ccc", marker: "circle" };
    }
    if (node.finalState === "SUCCESS") {
      return { color: "green", marker: "triangle" };
    }
    if (node.finalState === "ERROR") {
      return { color: "red", marker: "square" };
    }
    return { color: "blue", marker: "circle" };
  }

  private getEdgeStyle(edge: DependencyEdge): { stroke: string; dash: string } {
    if (edge.dependencyType === "STATE_TRANSITION") {
      return { stroke: "orange", dash: "5,5" };
    }
    if (edge.dependencyType === "DATA_FLOW") {
      return { stroke: "purple", dash: "2,2" };
    }
    return { stroke: "gray", dash: "1" };
  }

  public renderVisualization(): { nodes: any[]; edges: any[]; metadata: any } {
    const renderedNodes = this.graphData.nodes.map(node => {
      const style = this.getNodeStyle(node);
      return {
        id: node.id,
        label: `${node.toolName} (${node.initialState} -> ${node.finalState})`,
        style: {
          backgroundColor: style.color,
          shape: style.marker,
        },
        temporalInfo: {
          start: node.startTime,
          end: node.endTime,
        },
      };
    });

    const renderedEdges = this.graphData.edges.map(edge => {
      const style = this.getEdgeStyle(edge);
      let transitionDetails = null;
      if (edge.stateTransition) {
        transitionDetails = {
          from: edge.stateTransition.from,
          to: edge.stateTransition.to,
          reason: edge.stateTransition.reason,
        };
      }
      return {
        source: edge.sourceId,
        target: edge.targetId,
        style: {
          stroke: style.stroke,
          strokeDasharray: style.dash,
        },
        temporalInfo: {
          start: edge.startTime,
          end: edge.endTime,
        },
        stateTransition: transitionDetails,
      };
    });

    return {
      nodes: renderedNodes,
      edges: renderedEdges,
      metadata: {
        lastUpdate: this.graphData.metadata.lastUpdateTime,
        overallState: this.graphData.metadata.overallState,
      },
    };
  }
}