import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ResourceConstraint {
  resourceName: string;
  requiredAmount: number;
  startTime: number;
  endTime: number;
}

export interface TemporalEdge {
  sourceId: string;
  targetId: string;
  duration: number;
  startTime: number;
  endTime: number;
  resourceConstraints: ResourceConstraint[];
}

export interface ToolNode {
  id: string;
  name: string;
  input: Record<string, unknown>;
  startTime: number;
  endTime: number;
}

export interface DependencyGraphContext {
  nodes: ToolNode[];
  edges: TemporalEdge[];
  messages: Message[];
}

export class DependencyGraphVisualizerV27 {
  private graphContext: DependencyGraphContext;

  constructor(context: DependencyGraphContext) {
    this.graphContext = context;
  }

  private calculateOverlap(start1: number, end1: number, start2: number, end2: number): number {
    return Math.max(0, Math.min(end1, end2) - Math.max(start1, start2));
  }

  private processTemporalEdge(edge: TemporalEdge): {
    visualDuration: number;
    overlapInfo: string[];
  } {
    const overlaps: string[] = [];
    const node1 = this.graphContext.nodes.find(n => n.id === edge.sourceId);
    const node2 = this.graphContext.nodes.find(n => n.id === edge.targetId);

    if (node1 && node2) {
      const overlap = this.calculateOverlap(
        node1.startTime,
        node1.endTime,
        node2.startTime,
        node2.endTime
      );
      if (overlap > 0) {
        overlaps.push(`Overlap detected: ${overlap.toFixed(2)} units.`);
      }
    }

    return {
      visualDuration: edge.duration,
      overlapInfo: overlaps,
    };
  }

  public renderGraph(
    context: DependencyGraphContext
  ): {
    visualNodes: any[];
    visualEdges: any[];
    metadata: {
      temporalAnalysis: Record<string, {
        visualDuration: number;
        overlapInfo: string[];
      }>;
    }
  > {
    const temporalAnalysis: Record<string, {
      visualDuration: number;
      overlapInfo: string[];
    }> = {};

    const visualEdges: any[] = [];
    const visualNodes: any[] = [];

    for (const edge of context.edges) {
      const analysis = this.processTemporalEdge(edge);
      temporalAnalysis[edge.sourceId + "->" + edge.targetId] = analysis;

      visualEdges.push({
        source: edge.sourceId,
        target: edge.targetId,
        type: "temporal_dependency",
        metadata: {
          duration: edge.duration,
          overlaps: analysis.overlapInfo,
        },
      });
    }

    for (const node of context.nodes) {
      visualNodes.push({
        id: node.id,
        label: node.name,
        position: { x: 0, y: 0 }, // Placeholder for actual layout engine
        temporalBounds: {
          start: node.startTime,
          end: node.endTime,
        },
      });
    }

    return {
      visualNodes,
      visualEdges,
      metadata: { temporalAnalysis },
    };
  }
}