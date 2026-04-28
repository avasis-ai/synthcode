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

export interface ResourceUsage {
  cpu_cores: number;
  memory_gb: number;
  network_bandwidth_mbps: number;
}

export interface TimeWindow {
  start_time_seconds: number;
  end_time_seconds: number;
}

export interface TemporalResourceConstraint {
  time_window: TimeWindow;
  resource_usage: ResourceUsage;
}

export interface NodeConstraint {
  constraint: TemporalResourceConstraint;
  label: string;
}

export interface EdgeConstraint {
  constraint: TemporalResourceConstraint;
  dependency_type: string;
}

export interface GraphPayload {
  nodes: {
    id: string;
    content: ContentBlock[];
    constraints?: NodeConstraint;
  }[];
  edges: {
    sourceId: string;
    targetId: string;
    constraints?: EdgeConstraint;
  }[];
}

export class ToolExecutionDependencyGraphVisualizer {
  private payload: GraphPayload;

  constructor(payload: GraphPayload) {
    this.payload = payload;
  }

  public visualize(): {
    nodes: any[];
    edges: any[];
    metadata: {
      time_scale: {
        min: number;
        max: number;
      };
      resource_summary: {
        total_cpu: number;
        total_memory: number;
      };
    };
  } {
    const nodes = this.payload.nodes.map((node) => {
      const nodeVisual = {
        id: node.id,
        content: node.content,
        visual_elements: [],
        constraints: null,
      };

      if (node.constraints) {
        const constraint = node.constraints.constraint;
        nodeVisual.constraints = {
          time_box: {
            start: constraint.time_window.start_time_seconds,
            end: constraint.time_window.end_time_seconds,
          },
          resource_profile: constraint.resource_usage,
        };
        nodeVisual.visual_elements.push({
          type: "time_overlay",
          data: constraint.time_window,
          style: {
            background_color: "rgba(0, 123, 255, 0.1)",
          },
        });
        nodeVisual.visual_elements.push({
          type: "resource_indicator",
          data: constraint.resource_usage,
          style: {
            border_color: "blue",
          },
        });
      }
      return nodeVisual;
    });

    const edges = this.payload.edges.map((edge) => {
      const edgeVisual = {
        source: edge.sourceId,
        target: edge.targetId,
        visual_elements: [],
        constraints: null,
      };

      if (edge.constraints) {
        const constraint = edge.constraints.constraint;
        edgeVisual.constraints = {
          time_box: {
            start: constraint.time_window.start_time_seconds,
            end: constraint.time_window.end_time_seconds,
          },
          resource_profile: constraint.resource_usage,
        };
        edgeVisual.visual_elements.push({
          type: "time_overlay",
          data: constraint.time_window,
          style: {
            stroke_dasharray: "5,5",
          },
        });
        edgeVisual.visual_elements.push({
          type: "resource_indicator",
          data: constraint.resource_usage,
          style: {
            stroke_width: 3,
          },
        });
      }
      return edgeVisual;
    });

    const timeScale = {
      min: Math.min(
        ...this.payload.nodes.map((n) => n.constraints?.constraint.time_window.start_time_seconds),
        ...this.payload.edges.map((e) => e.constraints?.constraint.time_window.start_time_seconds)
      ),
      max: Math.max(
        ...this.payload.nodes.map((n) => n.constraints?.constraint.time_window.end_time_seconds),
        ...this.payload.edges.map((e) => e.constraints?.constraint.time_window.end_time_seconds)
      ),
    };

    const resourceSummary = {
      total_cpu: this.payload.nodes.reduce((sum, node) => {
        if (node.constraints) {
          return sum + node.constraints.constraint.resource_usage.cpu_cores;
        }
        return sum;
      }, 0),
      total_memory: this.payload.nodes.reduce((sum, node) => {
        if (node.constraints) {
          return sum + node.constraints.constraint.resource_usage.memory_gb;
        }
        return sum;
      }, 0),
    };

    return {
      nodes: nodes,
      edges: edges,
      metadata: {
        time_scale: {
          min: timeScale.min,
          max: timeScale.max,
        },
        resource_summary: resourceSummary,
      },
    };
  }
}