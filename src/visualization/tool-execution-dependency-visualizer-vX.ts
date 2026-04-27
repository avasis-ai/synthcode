import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "../types";

export interface ResourceConstraint {
  resourceName: string;
  requiredAmount: number;
  unit: string;
}

export interface TemporalConstraint {
  predecessorId: string;
  successorId: string;
  minDelayMs: number;
  maxDelayMs: number;
}

export interface ExecutionDependencyPayload {
  nodes: Record<string, {
    id: string;
    type: "tool" | "user_input" | "system";
    name: string;
    description: string;
    resources: ResourceConstraint[];
  }>;
  edges: Record<string, {
    sourceId: string;
    targetId: string;
    dependencyType: "sequential" | "conditional" | "parallel";
    constraints: TemporalConstraint[];
  }>;
}

export class ToolExecutionDependencyVisualizer {
  private payload: ExecutionDependencyPayload;

  constructor(payload: ExecutionDependencyPayload) {
    this.payload = payload;
  }

  private validatePayload(): boolean {
    const { nodes, edges } = this.payload;
    const nodeIds = Object.keys(nodes);
    for (const edgeId in edges) {
      const edge = edges[edgeId];
      if (!nodeIds.includes(edge.sourceId) || !nodeIds.includes(edge.targetId)) {
        console.error(`Edge ${edgeId} references unknown node.`);
        return false;
      }
    }
    return true;
  }

  public generateVisualizationInstructions(): {
    graphData: ExecutionDependencyPayload;
    renderingHints: {
      title: string;
      layoutAlgorithm: "force" | "dagre" | "custom_temporal";
      tooltipFormat: (key: string, data: any) => string;
    };
  } {
    if (!this.validatePayload()) {
      throw new Error("Invalid ExecutionDependencyPayload provided to the visualizer.");
    }

    return {
      graphData: this.payload,
      renderingHints: {
        title: "Tool Execution Dependency Graph with Temporal & Resource Constraints",
        layoutAlgorithm: "custom_temporal",
        tooltipFormat: (key: string, data: any) => {
          let output = `--- ${key} ---\n`;
          if (data.resources && data.resources.length > 0) {
            output += "Resources:\n";
            data.resources.forEach(r => {
              output += `  - ${r.resourceName}: ${r.requiredAmount} ${r.unit}\n`;
            });
          }
          if (data.constraints && data.constraints.length > 0) {
            output += "Temporal Constraints:\n";
            data.constraints.forEach(c => {
              output += `  - ${c.predecessorId} -> ${c.successorId}: ${c.minDelayMs}ms to ${c.maxDelayMs}ms\n`;
            });
          }
          return output.trim();
        },
      },
    };
  }
}