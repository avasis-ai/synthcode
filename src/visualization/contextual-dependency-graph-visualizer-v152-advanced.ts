import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface TemporalConstraint {
  startTime: number;
  endTime: number;
}

export interface ResourceConstraint {
  resourceId: string;
  capacityUsed: number;
}

export interface AdvancedEdge {
  source: string;
  target: string;
  metadata: {
    temporal?: TemporalConstraint;
    resource?: ResourceConstraint;
  };
}

export interface AdvancedNode {
  id: string;
  metadata: {
    temporal?: {
      startTime: number;
      endTime: number;
    };
    resource?: ResourceConstraint;
  };
}

export interface DependencyGraphPayload {
  nodes: AdvancedNode[];
  edges: AdvancedEdge[];
}

export interface AdvancedVisualizerConfig {
  showTemporalConstraints: boolean;
  temporalIntensityFactor: number;
  showResourceConstraints: boolean;
  resourceIntensityFactor: number;
}

export class ContextualDependencyGraphVisualizer {
  private config: AdvancedVisualizerConfig;

  constructor(initialConfig: AdvancedVisualizerConfig = {
    showTemporalConstraints: true,
    temporalIntensityFactor: 0.8,
    showResourceConstraints: true,
    resourceIntensityFactor: 0.7,
  }) {
    this.config = initialConfig;
  }

  setConfig(newConfig: Partial<AdvancedVisualizerConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
  }

  /**
   * Renders the graph, incorporating advanced temporal and resource constraint visualizations.
   * @param payload The enriched dependency graph data.
   * @returns A visualization description object.
   */
  public render(payload: DependencyGraphPayload): {
    visualizationData: any;
    description: string;
  } {
    const { nodes, edges } = payload;

    const renderNodeOverlays = (node: AdvancedNode[]): any[] => {
      return node.map((n) => {
        const resource = n.metadata.resource;
        if (!this.config.showResourceConstraints || !resource) {
          return null;
        }
        const intensity = this.config.resourceIntensityFactor * (resource.capacityUsed / 100);
        return {
          type: "resource_overlay",
          nodeId: n.id,
          resourceId: resource.resourceId,
          intensity: Math.min(1, intensity),
        };
      }).filter((item): item is any => item !== null);
    };

    const renderEdgeVisuals = (edge: AdvancedEdge[]): any[] => {
      return edge.map((e) => {
        const temporal = e.metadata.temporal;
        const resource = e.metadata.resource;

        let visuals: any[] = [];

        if (temporal && this.config.showTemporalConstraints) {
          const duration = temporal.endTime - temporal.startTime;
          const gradientValue = Math.min(1, (duration / 1000)); // Normalize duration for color mapping
          visuals.push({
            type: "temporal_gradient",
            edgeSource: e.source,
            edgeTarget: e.target,
            duration: duration,
            intensity: this.config.temporalIntensityFactor * gradientValue,
          });
        }

        if (resource && this.config.showResourceConstraints) {
          const intensity = this.config.resourceIntensityFactor * (resource.capacityUsed / 100);
          visuals.push({
            type: "resource_binding",
            edgeSource: e.source,
            edgeTarget: e.target,
            resourceId: resource.resourceId,
            intensity: Math.min(1, intensity),
          });
        }
        return visuals;
      }).flat();
    };

    const nodeOverlays = renderNodeOverlays(nodes);
    const edgeVisuals = renderEdgeVisuals(edges);

    const visualizationData = {
      nodes: nodes.map(n => ({ id: n.id, metadata: n.metadata })),
      edges: edges.map(e => ({ source: e.source, target: e.target, metadata: e.metadata })),
      nodeOverlays: nodeOverlays,
      edgeVisuals: edgeVisuals,
    };

    const description = `Graph visualized with ${nodes.length} nodes and ${edges.length} edges. Advanced constraints visible: Temporal=${this.config.showTemporalConstraints}, Resource=${this.config.showResourceConstraints}.`;

    return {
      visualizationData,
      description,
    };
  }
}