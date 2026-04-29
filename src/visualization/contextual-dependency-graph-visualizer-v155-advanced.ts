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

export interface TemporalConstraint {
  startTime: number;
  endTime: number;
}

export interface ResourceUsage {
  resourceName: string;
  usageAmount: number;
}

export interface NodeMetadata {
  metadata?: {
    temporal?: TemporalConstraint;
    resources?: ResourceUsage[];
  };
}

export interface EdgeMetadata {
  metadata?: {
    temporal?: TemporalConstraint;
    resources?: ResourceUsage[];
  };
}

export interface GraphPayload {
  nodes: Record<string, { id: string; label: string; metadata: NodeMetadata }>;
  edges: Record<string, { source: string; target: string; metadata: EdgeMetadata }>;
}

export interface VisualizerConfig {
  showTemporalOverlay: boolean;
  temporalIntensityFactor: number;
  showResourceOverlay: boolean;
  resourceWeightFactor: number;
}

export class ContextualDependencyGraphVisualizer {
  private payload: GraphPayload;
  private config: VisualizerConfig;

  constructor(payload: GraphPayload, config: Partial<VisualizerConfig> = {}) {
    this.payload = payload;
    this.config = {
      showTemporalOverlay: false,
      temporalIntensityFactor: 1.0,
      showResourceOverlay: false,
      resourceWeightFactor: 1.0,
      ...config,
    };
  }

  public visualize(): void {
    console.log("--- Contextual Dependency Graph Visualization Initialized ---");
    console.log("Payload Nodes:", Object.keys(this.payload.nodes).length);
    console.log("Payload Edges:", Object.keys(this.payload.edges).length);

    if (this.config.showTemporalOverlay) {
      this.renderTemporalConstraints();
    }

    if (this.config.showResourceOverlay) {
      this.renderResourceUsage();
    }

    console.log("Visualization rendering complete.");
  }

  private renderTemporalConstraints(): void {
    console.log("\n[Temporal Overlay Active]");
    Object.values(this.payload.nodes).forEach(node => {
      if (node.metadata?.temporal) {
        const { startTime, endTime } = node.metadata.temporal;
        const duration = endTime - startTime;
        console.log(`Node ${node.id}: Time Span [${startTime.toFixed(2)}s to ${endTime.toFixed(2)}s], Duration: ${duration.toFixed(2)}s`);
      }
    });

    Object.values(this.payload.edges).forEach(edge => {
      if (edge.metadata?.temporal) {
        const { startTime, endTime } = edge.metadata.temporal;
        const duration = endTime - startTime;
        console.log(`Edge ${edge.source} -> ${edge.target}: Time Span [${startTime.toFixed(2)}s to ${endTime.toFixed(2)}s], Duration: ${duration.toFixed(2)}s`);
      }
    });
  }

  private renderResourceUsage(): void {
    console.log("\n[Resource Usage Overlay Active]");
    Object.values(this.payload.nodes).forEach(node => {
      if (node.metadata?.resources) {
        console.log(`Node ${node.id} Resources:`);
        node.metadata.resources.forEach(res => {
          const weightedUsage = res.usageAmount * this.config.resourceWeightFactor;
          console.log(`  - ${res.resourceName}: Usage ${res.usageAmount.toFixed(2)} (Weighted: ${weightedUsage.toFixed(2)})`);
        });
      }
    });

    Object.values(this.payload.edges).forEach(edge => {
      if (edge.metadata?.resources) {
        console.log(`Edge ${edge.source} -> ${edge.target} Resources:`);
        edge.metadata.resources.forEach(res => {
          const weightedUsage = res.usageAmount * this.config.resourceWeightFactor;
          console.log(`  - ${res.resourceName}: Usage ${res.usageAmount.toFixed(2)} (Weighted: ${weightedUsage.toFixed(2)})`);
        });
      }
    });
  }

  public updateConfig(newConfig: Partial<VisualizerConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    console.log("\nConfiguration updated. Re-rendering visualization...");
    this.visualize();
  }
}