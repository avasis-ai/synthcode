import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ResourceConstraintPayload {
  resourceName: "memory" | "cpu" | "io";
  peakValue: number;
  threshold: number;
  severity: "low" | "medium" | "high";
}

export interface ResourceConstraintNode {
  nodeId: string;
  constraints: ResourceConstraintPayload[];
}

export interface ResourceConstraintEdge {
  sourceId: string;
  targetId: string;
  constraints: ResourceConstraintPayload[];
}

export interface DependencyGraphData {
  nodes: Record<string, { label: string; type: string }>;
  edges: { source: string; target: string; };
}

export interface ResourceGraphData extends DependencyGraphData {
  resourceNodes: Record<string, ResourceConstraintNode>;
  resourceEdges: Record<string, ResourceConstraintEdge>;
}

export class DynamicToolDependencyGraphVisualizer {
  private graphData: DependencyGraphData;
  private resourceGraphData: ResourceGraphData | null = null;

  constructor(initialGraphData: DependencyGraphData) {
    this.graphData = initialGraphData;
  }

  private calculateConstraintSeverity(peakValue: number, threshold: number): "low" | "medium" | "high" {
    const ratio = peakValue / threshold;
    if (ratio > 2.0) return "high";
    if (ratio > 1.2) return "medium";
    return "low";
  }

  private processResourceConstraints(
    nodes: Record<string, { label: string; type: string }>,
    edges: { source: string; target: string; },
    resourceNodes: Record<string, ResourceConstraintNode>,
    resourceEdges: Record<string, ResourceConstraintEdge>
  ): ResourceGraphData {
    const resourceGraphData: ResourceGraphData = {
      nodes: nodes,
      edges: edges,
      resourceNodes: resourceNodes,
      resourceEdges: resourceEdges,
    };
    return resourceGraphData;
  }

  public updateResourceData(
    resourceNodes: Record<string, ResourceConstraintNode>,
    resourceEdges: Record<string, ResourceConstraintEdge>
  ): void {
    this.resourceGraphData = this.processResourceConstraints(
      this.graphData.nodes,
      this.graphData.edges,
      resourceNodes,
      resourceEdges
    );
  }

  public getVisualizationData(): ResourceGraphData | DependencyGraphData {
    if (this.resourceGraphData) {
      return this.resourceGraphData;
    }
    return this.graphData;
  }

  public render(
    data: ResourceGraphData | DependencyGraphData,
    mode: "standard" | "resource_constrained"
  ): string {
    if (mode === "standard") {
      return `Rendering Standard Dependency Graph: ${JSON.stringify(data.nodes)}`;
    }

    if (mode === "resource_constrained" && data instanceof ResourceGraphData) {
      const highBottlenecks = Object.values(data.resourceNodes).filter(
        (node) => node.constraints.some((c) => c.severity === "high")
      );
      const highContentionEdges = Object.values(data.resourceEdges).filter(
        (edge) => edge.constraints.some((c) => c.severity === "high")
      );

      let output = `--- Resource Constrained Visualization Mode ---\n`;
      output += `Detected ${highBottlenecks.length} potential bottleneck nodes.\n`;
      output += `Detected ${highContentionEdges.length} high-contention edges.\n`;
      output += `Example Bottleneck Node: ${highBottlenecks[0]?.nodeId || "None"}\n`;
      output += `Example Contention Edge: ${highContentionEdges[0]?.sourceId} -> ${highContentionEdges[0]?.targetId || "None"}\n`;
      return output;
    }

    return "Error: Invalid visualization data or mode.";
  }
}