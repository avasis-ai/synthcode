import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface NodeMetadata {
  nodeId: string;
  startTimeMs: number;
  endTimeMs: number;
  resourceUsage: Record<string, number>;
  label: string;
}

export interface EdgeMetadata {
  sourceId: string;
  targetId: string;
  durationMs: number;
  resourceConstraint: {
    resourceName: string;
    minUsage: number;
    maxUsage: number;
  };
}

export interface EnrichedGraphData {
  nodes: NodeMetadata[];
  edges: EdgeMetadata[];
  dependencies: {
    sourceId: string;
    targetId: string;
  }[];
}

export class DependencyGraphVisualizerV21 {
  private graphData: EnrichedGraphData;

  constructor(initialData: EnrichedGraphData) {
    this.graphData = initialData;
  }

  public processAndRender(
    graphData: EnrichedGraphData
  ): void {
    this.graphData = graphData;
    console.log("Rendering enriched dependency graph...");
    this.renderNodesWithTemporalData();
    this.renderEdgesWithConstraints();
    console.log("Visualization rendering complete.");
  }

  private renderNodesWithTemporalData(): void {
    console.log("Rendering nodes with time windows and resource usage...");
    this.graphData.nodes.forEach((node) => {
      console.log(
        `Node ${node.nodeId}: Time Window [${node.startTimeMs}ms - ${node.endTimeMs}ms], Resources:`,
        node.resourceUsage
      );
    });
  }

  private renderEdgesWithConstraints(): void {
    console.log("Rendering edges with resource constraints...");
    this.graphData.edges.forEach((edge) => {
      console.log(
        `Edge ${edge.sourceId} -> ${edge.targetId}: Duration ${edge.durationMs}ms, Constraint:`,
        edge.resourceConstraint
      );
    });
  }

  public getGraphData(): EnrichedGraphData {
    return this.graphData;
  }
}