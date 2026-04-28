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

interface ResourceConstraint {
  resourceName: string;
  minAmount: number;
  maxAmount: number;
}

interface TemporalConstraint {
  startTimeMs: number;
  endTimeMs: number;
}

interface CapabilityRelationship {
  sourceCapability: string;
  targetCapability: string;
  required: boolean;
}

interface AdvancedNodePayload {
  id: string;
  type: "tool" | "user_action" | "system";
  name: string;
  metadata: {
    resources?: ResourceConstraint[];
    temporal?: TemporalConstraint;
    capabilities?: CapabilityRelationship[];
  };
}

interface AdvancedEdgePayload {
  sourceId: string;
  targetId: string;
  type: "dependency" | "data_flow" | "temporal_link";
  metadata: {
    latencyMs?: number;
    requiredResources?: ResourceConstraint[];
  };
}

interface DependencyGraphData {
  nodes: AdvancedNodePayload[];
  edges: AdvancedEdgePayload[];
}

export class ToolExecutionDependencyGraphVisualizerAdvanced {
  private graphData: DependencyGraphData;

  constructor(graphData: DependencyGraphData) {
    this.graphData = graphData;
  }

  private validatePayload(data: DependencyGraphData): boolean {
    if (!data || !data.nodes || !data.edges) {
      return false;
    }
    return data.nodes.every(node => node.id && node.name);
  }

  private renderNode(node: AdvancedNodePayload): string {
    let output = `Node [${node.id}] (${node.name}): `;
    if (node.metadata.temporal) {
      output += `Time: [${node.metadata.temporal.startTimeMs} - ${node.metadata.temporal.endTimeMs}] | `;
    }
    if (node.metadata.resources) {
      const resStr = node.metadata.resources.map(r => `${r.resourceName}: ${r.minAmount}-${r.maxAmount}`).join(", ");
      output += `Resources: {${resStr}} | `;
    }
    if (node.metadata.capabilities) {
      const capStr = node.metadata.capabilities.map(c => `${c.sourceCapability} -> ${c.targetCapability}`).join(", ");
      output += `Caps: {${capStr}}`;
    }
    return output;
  }

  private renderEdge(edge: AdvancedEdgePayload): string {
    let output = `Edge (${edge.sourceId} -> ${edge.targetId}): `;
    if (edge.metadata.latencyMs !== undefined) {
      output += `Latency: ${edge.metadata.latencyMs}ms | `;
    }
    if (edge.metadata.requiredResources) {
      const resStr = edge.metadata.requiredResources.map(r => r.resourceName).join(", ");
      output += `Requires: {${resStr}}`;
    }
    return output;
  }

  public visualize(): string {
    if (!this.validatePayload(this.graphData)) {
      return "Error: Invalid or incomplete dependency graph data provided.";
    }

    let visualizationOutput = "--- Advanced Tool Execution Dependency Graph Visualization ---\n";

    visualizationOutput += "\n[Nodes]\n";
    this.graphData.nodes.forEach(node => {
      visualizationOutput += this.renderNode(node) + "\n";
    });

    visualizationOutput += "\n[Edges]\n";
    this.graphData.edges.forEach(edge => {
      visualizationOutput += this.renderEdge(edge) + "\n";
    });

    visualizationOutput += "\n--- Visualization Complete ---";
    return visualizationOutput;
  }
}