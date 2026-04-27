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

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  metadata: {
    // Temporal constraints: e.g., [start_time, end_time]
    timeWindow?: [number, number];
    // Resource constraints: e.g., { resourceName: "CPU", requiredUnits: 2 }
    resourceConstraints?: Record<string, { requiredUnits: number }>;
    // Dependency type: e.g., "runtime", "config", "data_flow"
    dependencyType: "runtime" | "config" | "data_flow";
  };
}

export interface DependencyGraph {
  nodes: Record<string, { id: string; label: string; metadata: Record<string, unknown> }>;
  edges: DependencyEdge[];
}

export class ToolDependencyGraphVisualizerV25 {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  public visualize(): string {
    let output = "--- Dependency Graph Visualization (V2.5) ---\n";

    output += this.visualizeNodes();
    output += this.visualizeEdges();

    output += "\n--- Visualization Complete ---";
    return output;
  }

  private visualizeNodes(): string {
    let output = "Nodes:\n";
    for (const nodeId in this.graph.nodes) {
      const node = this.graph.nodes[nodeId];
      output += `  - ${node.id}: ${node.label}\n`;
      if (Object.keys(node.metadata).length > 0) {
        output += "    Metadata: " + JSON.stringify(node.metadata) + "\n";
      }
    }
    return output;
  }

  private visualizeEdges(): string {
    let output = "\nEdges (Dependencies):\n";
    for (const edge of this.graph.edges) {
      output += `  [${edge.sourceId} -> ${edge.targetId}] (${edge.metadata.dependencyType}):\n`;

      if (edge.metadata.timeWindow) {
        const [start, end] = edge.metadata.timeWindow;
        output += `    [Temporal]: Active from ${start} to ${end} (Time Window).\n`;
      }

      if (edge.metadata.resourceConstraints) {
        output += "    [Resources]: ";
        let resourceList = [];
        for (const [resource, constraint] of Object.entries(edge.metadata.resourceConstraints)) {
          resourceList.push(`${resource}:${constraint.requiredUnits}`);
        }
        output += resourceList.join(", ") + ".\n";
      }

      if (edge.metadata.dependencyType === "runtime") {
        output += "    (Type: Runtime dependency detected).\n";
      }
    }
    return output;
  }
}