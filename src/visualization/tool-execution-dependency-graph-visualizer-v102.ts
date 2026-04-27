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
  requiredAmount: number;
  unit: string;
}

export interface TemporalMetadata {
  startTimeMs: number;
  endTimeMs: number;
}

export interface ToolExecutionNode {
  id: string;
  name: string;
  metadata: {
    temporal: TemporalMetadata;
    resources: ResourceConstraint[];
  };
  // Existing graph properties
  dependencies: string[];
}

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  // New properties for visualization logic
  temporalWeight: number; // e.g., time difference or dependency latency
  resourceFlow: ResourceConstraint; // The resource transferred/consumed across the edge
}

export interface DependencyGraphData {
  nodes: ToolExecutionNode[];
  edges: DependencyEdge[];
}

export interface VisualizerConfig {
  showTemporalOverlay: boolean;
  showResourceOverlay: boolean;
  layoutAlgorithm: "dagre" | "force";
}

export class ToolExecutionDependencyGraphVisualizerV102 {
  private graphData: DependencyGraphData;
  private config: VisualizerConfig;

  constructor(graphData: DependencyGraphData, config: VisualizerConfig = {
    showTemporalOverlay: true,
    showResourceOverlay: true,
    layoutAlgorithm: "dagre",
  }) {
    this.graphData = graphData;
    this.config = config;
  }

  public updateConfig(newConfig: Partial<VisualizerConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
  }

  public renderGraph(): void {
    console.log("Rendering Tool Execution Dependency Graph V102...");
    console.log("--- Configuration ---");
    console.log(`Temporal Overlay Visible: ${this.config.showTemporalOverlay}`);
    console.log(`Resource Overlay Visible: ${this.config.showResourceOverlay}`);
    console.log(`Layout Algorithm: ${this.config.layoutAlgorithm}`);

    if (!this.graphData.nodes.length || !this.graphData.edges.length) {
      console.warn("No graph data available to render.");
      return;
    }

    this.renderNodes();
    this.renderEdges();
  }

  private renderNodes(): void {
    console.log("\n[Nodes Rendering]");
    for (const node of this.graphData.nodes) {
      console.log(`  Node ${node.id} (${node.name}):`);
      console.log(`    Dependencies: ${node.dependencies.join(", ")}`);
      console.log(`    Temporal Span: ${node.metadata.temporal.startTimeMs}ms to ${node.metadata.temporal.endTimeMs}ms`);
      if (node.metadata.resources.length > 0) {
        console.log("    Resource Usage:");
        node.metadata.resources.forEach(r => {
          console.log(`      - ${r.resourceName}: ${r.requiredAmount}${r.unit}`);
        });
      }
    }
  }

  private renderEdges(): void {
    console.log("\n[Edges Rendering]");
    for (const edge of this.graphData.edges) {
      console.log(`  Edge ${edge.sourceId} -> ${edge.targetId}:`);
      console.log(`    Temporal Weight: ${edge.temporalWeight.toFixed(2)}`);
      console.log(`    Resource Flow: ${edge.resourceFlow.requiredAmount}${edge.resourceFlow.unit} of ${edge.resourceFlow.resourceName}`);
    }
  }

  public getVisualizationData(): {
    nodes: ToolExecutionNode[];
    edges: DependencyEdge[];
  } {
    return {
      nodes: this.graphData.nodes,
      edges: this.graphData.edges,
    };
  }
}