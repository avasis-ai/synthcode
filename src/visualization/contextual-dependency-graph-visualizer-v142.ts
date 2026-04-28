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
  resourceName: string;
  timestamp: number;
  usageValue: number;
}

export interface TemporalConstraint {
  startTime: number;
  endTime: number;
  description: string;
}

export interface DependencyNode {
  id: string;
  label: string;
  position: { x: number; y: number };
  resourceUsage: ResourceUsage[];
  constraints: TemporalConstraint[];
}

export interface DependencyEdge {
  id: string;
  sourceId: string;
  targetId: string;
  weight: number;
  resourceUsage: ResourceUsage[];
  constraints: TemporalConstraint[];
}

export interface GraphPayload {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface VisualizationConfig {
  showResourceOverlay: boolean;
  resourceAggregationMethod: 'average' | 'max' | 'sum';
  showTemporalOverlay: boolean;
  temporalAggregationMethod: 'min' | 'max';
}

export class ContextualDependencyGraphVisualizer {
  private payload: GraphPayload;
  private config: VisualizationConfig;

  constructor(payload: GraphPayload, initialConfig: VisualizationConfig) {
    this.payload = payload;
    this.config = {
      showResourceOverlay: true,
      resourceAggregationMethod: 'average',
      showTemporalOverlay: true,
      temporalAggregationMethod: 'max',
    };
    this.updateConfig(initialConfig);
  }

  private updateConfig(newConfig: Partial<VisualizationConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
  }

  public updatePayload(newPayload: GraphPayload): void {
    this.payload = newPayload;
  }

  public updateConfig(newConfig: Partial<VisualizationConfig>): void {
    this.updateConfig(newConfig);
  }

  private aggregateResourceUsage(usages: ResourceUsage[], method: 'average' | 'max' | 'sum'): number {
    if (usages.length === 0) return 0;
    const values = usages.map(u => u.usageValue);
    switch (method) {
      case 'average':
        return values.reduce((acc, val) => acc + val, 0) / values.length;
      case 'max':
        return Math.max(...values);
      case 'sum':
        return values.reduce((acc, val) => acc + val, 0);
      default:
        return 0;
    }
  }

  private processNodeData(node: DependencyNode): { aggregatedResource: number; aggregatedTime: number } {
    const resourceAgg = this.aggregateResourceUsage(node.resourceUsage, this.config.resourceAggregationMethod);
    const timeAgg = this.config.temporalAggregationMethod === 'max' ? Math.max(...node.constraints.map(c => c.endTime - c.startTime)) : Math.min(...node.constraints.map(c => c.startTime));
    return { aggregatedResource: resourceAgg, aggregatedTime: timeAgg };
  }

  private processEdgeData(edge: DependencyEdge): { aggregatedResource: number; aggregatedTime: number } {
    const resourceAgg = this.aggregateResourceUsage(edge.resourceUsage, this.config.resourceAggregationMethod);
    const timeAgg = this.config.temporalAggregationMethod === 'max' ? Math.max(...edge.constraints.map(c => c.endTime - c.startTime)) : Math.min(...edge.constraints.map(c => c.startTime));
    return { aggregatedResource: resourceAgg, aggregatedTime: timeAgg };
  }

  public getVisualizationData(): {
    nodes: {
      id: string;
      label: string;
      position: { x: number; y: number };
      resourceMetrics: { aggregatedResource: number; aggregatedTime: number };
    }[];
    edges: {
      id: string;
      sourceId: string;
      targetId: string;
      weight: number;
      resourceMetrics: { aggregatedResource: number; aggregatedTime: number };
    }[];
  } {
    const processedNodes = this.payload.nodes.map(node => ({
      id: node.id,
      label: node.label,
      position: node.position,
      resourceMetrics: this.processNodeData(node),
    }));

    const processedEdges = this.payload.edges.map(edge => ({
      id: edge.id,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      weight: edge.weight,
      resourceMetrics: this.processEdgeData(edge),
    }));

    return { nodes: processedNodes, edges: processedEdges };
  }
}