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

export interface DependencyEdge {
  source: string;
  target: string;
  dependencyType: "sequential" | "parallel" | "conditional";
  constraints?: {
    startTime?: number;
    endTime?: number;
    requiredResource?: string;
    resourceCapacity?: number;
  };
}

export interface ToolExecutionGraphPayload {
  tools: Record<string, {
    name: string;
    description: string;
    inputs: Record<string, string>;
  }>;
  edges: DependencyEdge[];
  initialToolId: string;
}

export class ToolExecutionDependencyGraphVisualizer {
  private payload: ToolExecutionGraphPayload;

  constructor(payload: ToolExecutionGraphPayload) {
    this.payload = payload;
  }

  public visualize(): {
    visualizationData: any;
    viewMode: "standard" | "advanced_flow";
  } {
    const visualizationData = this.processPayloadForVisualization();
    return {
      visualizationData,
      viewMode: "advanced_flow",
    };
  }

  private processPayloadForVisualization(): any {
    const nodes = Object.keys(this.payload.tools).map((toolId) => ({
      id: toolId,
      name: this.payload.tools[toolId].name,
      description: this.payload.tools[toolId].description,
      inputs: this.payload.tools[toolId].inputs,
      // Placeholder for visualization specific data derived from edges
      executionMetrics: {
        minTime: 0,
        maxTime: 0,
        resourceUsage: [],
      },
    }));

    const processedEdges = this.payload.edges.map(edge => {
      const baseEdge: any = {
        source: edge.source,
        target: edge.target,
        type: edge.dependencyType,
        constraints: edge.constraints || {},
      };

      if (edge.constraints) {
        return {
          ...baseEdge,
          isBottleneck: this.isBottleneck(edge.constraints),
          temporalData: {
            startTime: edge.constraints.startTime,
            endTime: edge.constraints.endTime,
            duration: edge.constraints.endTime && edge.constraints.startTime
              ? edge.constraints.endTime - edge.constraints.startTime
              : undefined,
          },
          resourceData: {
            requiredResource: edge.constraints.requiredResource,
            capacity: edge.constraints.resourceCapacity,
          },
        };
      }
      return baseEdge;
    });

    return {
      nodes: nodes,
      edges: processedEdges,
      metadata: {
        initialToolId: this.payload.initialToolId,
        viewType: "Advanced Execution Flow",
      },
    };
  }

  private isBottleneck(constraints: {
    startTime?: number;
    endTime?: number;
    requiredResource?: string;
    resourceCapacity?: number;
  }): boolean {
    const hasTimeConstraint = constraints.startTime !== undefined || constraints.endTime !== undefined;
    const hasResourceConstraint = constraints.requiredResource || constraints.resourceCapacity !== undefined;

    return hasTimeConstraint || hasResourceConstraint;
  }
}