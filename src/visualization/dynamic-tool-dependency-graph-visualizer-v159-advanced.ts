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
  minCapacity: number;
  maxCapacity: number;
}

interface TemporalConstraint {
  startTime?: number; // Unix timestamp or relative time unit
  endTime?: number;   // Unix timestamp or relative time unit
}

interface NodePayload {
  id: string;
  name: string;
  type: "tool" | "process" | "data_source";
  dependencies: string[];
  temporal?: TemporalConstraint;
  resources?: ResourceConstraint[];
  capabilities?: string[];
}

interface EdgePayload {
  sourceId: string;
  targetId: string;
  weight: number; // Standard dependency weight
  temporal?: TemporalConstraint;
  resourceFlow?: {
    resourceName: string;
    flowAmount: number;
  }[];
}

interface DependencyGraphData {
  nodes: NodePayload[];
  edges: EdgePayload[];
}

type GraphVisualizerState = {
  data: DependencyGraphData;
  isLoading: boolean;
  lastUpdated: number;
};

export class DynamicToolDependencyGraphVisualizerAdvanced {
  private state: GraphVisualizerState;

  constructor(initialData: DependencyGraphData) {
    this.state = {
      data: initialData,
      isLoading: false,
      lastUpdated: Date.now(),
    };
  }

  private validateAndMergeData(newData: DependencyGraphData): DependencyGraphData {
    // Simple merge logic for demonstration: prioritize new data structure
    return {
      nodes: newData.nodes || [],
      edges: newData.edges || [],
    };
  }

  public updateGraphData(newData: DependencyGraphData): void {
    const mergedData = this.validateAndMergeData(newData);
    this.state = {
      data: mergedData,
      isLoading: false,
      lastUpdated: Date.now(),
    };
  }

  public setLoading(isLoading: boolean): void {
    this.state = {
      ...this.state,
      isLoading: isLoading,
    };
  }

  public getGraphState(): GraphVisualizerState {
    return this.state;
  }

  private renderNode(node: NodePayload): string {
    let output = `Node ${node.id} (${node.name}):\n`;
    output += `  Type: ${node.type}\n`;
    if (node.temporal) {
      output += `  Time Window: [${node.temporal.startTime ? node.temporal.startTime.toString() : 'N/A'} - ${node.temporal.endTime ? node.temporal.endTime.toString() : 'N/A'}]\n`;
    }
    if (node.resources && node.resources.length > 0) {
      output += `  Resources: ${node.resources.map(r => `${r.resourceName}: ${r.minCapacity}-${r.maxCapacity}`).join(', ')}\n`;
    }
    if (node.capabilities && node.capabilities.length > 0) {
      output += `  Capabilities: ${node.capabilities.join(', ')}\n`;
    }
    return output;
  }

  private renderEdge(edge: EdgePayload): string {
    let output = `Edge ${edge.sourceId} -> ${edge.targetId} (Weight: ${edge.weight}):\n`;
    if (edge.temporal) {
      output += `  Temporal Constraint: [${edge.temporal.startTime ? edge.temporal.startTime.toString() : 'N/A'} - ${edge.temporal.endTime ? edge.temporal.endTime.toString() : 'N/A'}]\n`;
    }
    if (edge.resourceFlow && edge.resourceFlow.length > 0) {
      output += `  Resource Flow: ${edge.resourceFlow.map(rf => `${rf.resourceName}: ${rf.flowAmount}`).join('; ')}\n`;
    }
    return output;
  }

  public visualize(): string {
    const { data } = this.state;
    let visualizationOutput = "--- Advanced Dependency Graph Visualization ---\n\n";

    if (this.state.isLoading) {
      visualizationOutput += "Loading graph data...\n";
      return visualizationOutput;
    }

    visualizationOutput += "--- Nodes ---\n";
    data.nodes.forEach(node => {
      visualizationOutput += this.renderNode(node) + "\n";
    });

    visualizationOutput += "\n--- Edges ---\n";
    data.edges.forEach(edge => {
      visualizationOutput += this.renderEdge(edge) + "\n";
    });

    visualizationOutput += "\n--- Visualization Complete ---\n";
    return visualizationOutput;
  }
}