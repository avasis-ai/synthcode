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

export interface NodeMetadata {
  id: string;
  label: string;
  resourceConstraints?: {
    required: string;
    limit: number;
  };
  temporalWindow?: {
    startMs: number;
    endMs: number;
  };
}

export interface EdgeMetadata {
  sourceId: string;
  targetId: string;
  resourceDependency?: {
    resource: string;
    bottleneckSeverity: 'low' | 'medium' | 'high';
  };
  temporalDependency?: {
    minDelayMs: number;
    maxDelayMs: number;
  };
}

export interface GraphPayload {
  nodes: NodeMetadata[];
  edges: EdgeMetadata[];
}

export interface AdvancedVisualizerConfig {
  showResourceConstraints: boolean;
  resourceConstraintSeverityMap: Record<'low' | 'medium' | 'high', string>;
  showTemporalDependencies: boolean;
  temporalDependencyColorMap: Record<boolean, string>;
}

export class ContextualDependencyGraphVisualizer {
  private config: AdvancedVisualizerConfig;

  constructor(config: AdvancedVisualizerConfig = {
    showResourceConstraints: true,
    resourceConstraintSeverityMap: {
      low: "#4CAF50";
      medium: "#FFC107";
      high: "#F44336";
    },
    showTemporalDependencies: true,
    temporalDependencyColorMap: {
      true: "#2196F3";
      false: "#9E9E9E";
    },
  }) {
    this.config = config;
  }

  private getEdgeStyle(edge: EdgeMetadata): {
    stroke: string;
    strokeWidth: number;
    label: string;
  } {
    let stroke = "#999";
    let strokeWidth = 1;
    let label = "";

    if (this.config.showResourceConstraints && edge.resourceDependency) {
      const severity = edge.resourceDependency.bottleneckSeverity;
      stroke = this.config.resourceConstraintSeverityMap[severity] || "#999";
      strokeWidth = Math.min(3, 1 + (severity === 'high' ? 2 : 1));
      label = `[R:${severity.toUpperCase()}]`;
    }

    if (this.config.showTemporalDependencies && edge.temporalDependency) {
      const delay = (edge.temporalDependency.maxDelayMs - edge.temporalDependency.minDelayMs) / 2;
      const color = this.config.temporalDependencyColorMap[true] || "#2196F3";
      stroke = color;
      strokeWidth = Math.max(2, Math.ceil(delay / 100));
      label += ` | [T:${Math.round(delay)}ms]`;
    }

    return { stroke, strokeWidth, label };
  }

  private getNodeStyle(node: NodeMetadata): {
    fill: string;
    radius: number;
    icon: string | null;
  } {
    let fill = "#E0F7FA";
    let radius = 15;
    let icon: string | null = null;

    if (node.resourceConstraints) {
      const constraint = node.resourceConstraints;
      const severity = constraint.limit < 10 ? 'high' : (constraint.limit < 50 ? 'medium' : 'low');
      fill = this.config.resourceConstraintSeverityMap[severity] || "#E0F7FA";
      radius = 20;
      icon = `[R:${severity.charAt(0).toUpperCase()}]`;
    }

    if (node.temporalWindow) {
      const duration = node.temporalWindow.endMs - node.temporalWindow.startMs;
      const color = this.config.temporalDependencyColorMap[true] || "#2196F3";
      fill = color;
      radius = 25;
      icon = `[T:${Math.round(duration/1000)}s]`;
    }

    return { fill, radius, icon };
  }

  public visualize(payload: GraphPayload): {
    nodes: {
      style: {
        fill: string;
        radius: number;
        icon: string | null;
      };
      metadata: NodeMetadata;
    }[];
    edges: {
      style: {
        stroke: string;
        strokeWidth: number;
        label: string;
      };
      metadata: EdgeMetadata;
    }[];
  } {
    const styledNodes = payload.nodes.map(node => ({
      style: this.getNodeStyle(node),
      metadata: node,
    }));

    const styledEdges = payload.edges.map(edge => ({
      style: this.getEdgeStyle(edge),
      metadata: edge,
    }));

    return {
      nodes: styledNodes,
      edges: styledEdges,
    };
  }
}