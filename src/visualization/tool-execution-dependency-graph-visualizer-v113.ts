import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ResourceProfile {
  resourceName: string;
  usageOverTime: { time: number; usage: number }[];
}

export interface TemporalNode {
  nodeId: string;
  startTime: number;
  endTime: number;
  resourceProfiles: ResourceProfile[];
  isConstraintViolated: boolean;
}

export interface TemporalEdge {
  sourceId: string;
  targetId: string;
  startTime: number;
  endTime: number;
  resourceConstraint: {
    resourceName: string;
    violationDetected: boolean;
  };
}

export interface EnrichedGraphPayload {
  nodes: TemporalNode[];
  edges: TemporalEdge[];
  metadata: {
    totalDuration: number;
    timeScaleFactor: number;
  };
}

export class ToolExecutionDependencyGraphVisualizerV113 {
  private graphData: EnrichedGraphPayload;

  constructor(graphData: EnrichedGraphPayload) {
    this.graphData = graphData;
  }

  private calculateLayoutMetrics(nodes: TemporalNode[]): {
    minTime: number;
    maxTime: number;
  } {
    const times = nodes.map(node => node.startTime);
    const endTimes = nodes.map(node => node.endTime);
    const minTime = Math.min(...times, ...endTimes);
    const maxTime = Math.max(...times, ...endTimes);
    return { minTime, maxTime };
  }

  private generateVisualizationPayload(
    nodes: TemporalNode[];
    edges: TemporalEdge[];
  ): {
    nodeVisuals: any[];
    edgeVisuals: any[];
    timeAxis: {
      min: number;
      max: number;
      scaleFactor: number;
    };
  } {
    const { minTime, maxTime } = this.calculateLayoutMetrics(nodes);

    const nodeVisuals = nodes.map((node) => ({
      id: node.nodeId,
      xStart: node.startTime,
      xEnd: node.endTime,
      yPosition: Math.random() * 100 + 50, // Placeholder Y positioning
      isViolated: node.isConstraintViolated,
      resourceDetails: node.resourceProfiles.map(
        (profile) => ({
          resource: profile.resourceName,
          usage: profile.usageOverTime,
        })
      ),
    }));

    const edgeVisuals = edges.map((edge) => ({
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      xStart: edge.startTime,
      xEnd: edge.endTime,
      yPosition: 0, // Placeholder Y positioning
      isViolated: edge.resourceConstraint.violationDetected,
      resourceConstraint: edge.resourceConstraint,
    }));

    const timeScaleFactor = (maxTime - minTime) > 0 ? 1 / (maxTime - minTime) : 0;

    return {
      nodeVisuals,
      edgeVisuals,
      timeAxis: {
        min: minTime,
        max: maxTime,
        scaleFactor: timeScaleFactor,
      },
    };
  }

  public renderGraphVisualization(
    payload: EnrichedGraphPayload
  ): {
    nodeVisuals: any[];
    edgeVisuals: any[];
    timeAxis: {
      min: number;
      max: number;
      scaleFactor: number;
    };
  } {
    if (!payload || !payload.nodes || !payload.edges) {
      throw new Error("Invalid graph payload provided.");
    }
    return this.generateVisualizationPayload(payload.nodes, payload.edges);
  }
}