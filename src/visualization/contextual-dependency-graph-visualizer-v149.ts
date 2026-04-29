import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ResourceConstraint {
  resourceName: string;
  limit: number;
  unit: string;
}

export interface TemporalConstraint {
  startTimeMs: number;
  endTimeMs: number;
}

export interface NodePayload {
  id: string;
  label: string;
  constraints?: {
    temporal?: TemporalConstraint[];
    resources?: ResourceConstraint[];
  };
}

export interface EdgePayload {
  sourceId: string;
  targetId: string;
  weight: number;
  constraints?: {
    temporal?: TemporalConstraint[];
    resources?: ResourceConstraint[];
  };
}

export interface DependencyGraph {
  nodes: NodePayload[];
  edges: EdgePayload[];
}

export interface VisualizerConfig {
  showTemporalConstraints: boolean;
  showResourceConstraints: boolean;
  nodeSizeScale: number;
  edgeThicknessScale: number;
}

export class ContextualDependencyGraphVisualizer {
  private graph: DependencyGraph;
  private config: VisualizerConfig;

  constructor(graph: DependencyGraph, config: Partial<VisualizerConfig> = {}) {
    this.graph = graph;
    this.config = {
      showTemporalConstraints: false,
      showResourceConstraints: false,
      nodeSizeScale: 1.0,
      edgeThicknessScale: 1.0,
      ...config,
    };
  }

  public visualize(): void {
    console.log("Visualizing Contextual Dependency Graph...");
    this.renderNodes();
    this.renderEdges();
    this.renderConstraints();
  }

  private renderNodes(): void {
    console.log(`Rendering ${this.graph.nodes.length} nodes.`);
    this.graph.nodes.forEach(node => {
      console.log(`  Node: ${node.id} - ${node.label}`);
      if (node.constraints) {
        console.log("    Constraints found:", {
          temporal: node.constraints.temporal,
          resources: node.constraints.resources,
        });
      }
    });
  }

  private renderEdges(): void {
    console.log(`Rendering ${this.graph.edges.length} edges.`);
    this.graph.edges.forEach(edge => {
      console.log(`  Edge: ${edge.sourceId} -> ${edge.targetId} (Weight: ${edge.weight})`);
      if (edge.constraints) {
        console.log("    Constraints found:", {
          temporal: edge.constraints.temporal,
          resources: edge.constraints.resources,
        });
      }
    });
  }

  private renderConstraints(): void {
    if (!this.config.showTemporalConstraints && !this.config.showResourceConstraints) {
      console.log("Constraint visualization disabled by configuration.");
      return;
    }

    console.log("--- Rendering Advanced Constraints ---");

    this.graph.nodes.forEach(node => {
      if (node.constraints) {
        if (this.config.showTemporalConstraints && node.constraints.temporal) {
          console.log(`[Temporal] Node ${node.id}: ${node.constraints.temporal.length} time constraints applied.`);
        }
        if (this.config.showResourceConstraints && node.constraints.resources) {
          console.log(`[Resource] Node ${node.id}: ${node.constraints.resources.length} resource constraints applied.`);
        }
      }
    });

    this.graph.edges.forEach(edge => {
      if (edge.constraints) {
        if (this.config.showTemporalConstraints && edge.constraints.temporal) {
          console.log(`[Temporal] Edge ${edge.sourceId}->${edge.targetId}: ${edge.constraints.temporal.length} time constraints applied.`);
        }
        if (this.config.showResourceConstraints && edge.constraints.resources) {
          console.log(`[Resource] Edge ${edge.sourceId}->${edge.targetId}: ${edge.constraints.resources.length} resource constraints applied.`);
        }
      }
    });
  }

  public updateConfig(newConfig: Partial<VisualizerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("Visualizer configuration updated.");
  }
}