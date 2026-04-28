import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ResourceUsage {
  resourceName: string;
  amount: number;
  unit: string;
}

export interface TemporalConstraint {
  predecessorId: string;
  successorId: string;
  minDelayMs: number;
  maxDelayMs: number;
}

export interface ToolExecutionNode {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  executionTimeMs: number;
  resourcesUsed: ResourceUsage[];
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  type: "dependency" | "temporal";
  constraint?: TemporalConstraint;
}

export interface GraphNode {
  id: string;
  type: "user" | "assistant" | "tool";
  label: string;
  metadata: Record<string, any>;
}

export interface DependencyGraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
  temporalConstraints: TemporalConstraint[];
}

export class ToolExecutionDependencyGraphVisualizer {
  private readonly graphPayload: DependencyGraphPayload;

  constructor(payload: DependencyGraphPayload) {
    this.graphPayload = payload;
  }

  public renderGraph(): string {
    const { nodes, edges, temporalConstraints } = this.graphPayload;

    let mermaidDefinition = "graph TD;\n";

    // 1. Define Nodes
    nodes.forEach(node => {
      let nodeId = node.id;
      let label = node.label;
      let style = "";

      if (node.type === "user") {
        style = "style(nodeId) fill:#e0f7fa,stroke:#00bcd4,stroke-width:2px";
      } else if (node.type === "assistant") {
        style = "style(nodeId) fill:#fff9c4,stroke:#ffc107,stroke-width:2px";
      } else if (node.type === "tool") {
        style = "style(nodeId) fill:#e8eaf0,stroke:#3f51b5,stroke-width:2px";
      }

      mermaidDefinition += `${nodeId}["${label}"] ${style};\n`;
    });

    // 2. Define Edges (Dependencies)
    edges.forEach(edge => {
      let edgeDefinition = `${edge.sourceId} -- ${edge.type === "dependency" ? "Depends On" : "Flows To"} --> ${edge.targetId};`;
      mermaidDefinition += edgeDefinition + "\n";
    });

    // 3. Define Temporal Constraints (Using subgraphs or specific styling if Mermaid supports it, otherwise descriptive comments/nodes)
    // For simplicity in a single Mermaid block, we'll add a note or use a specific edge type if possible.
    if (temporalConstraints.length > 0) {
      mermaidDefinition += "\n%% Temporal Constraints:\n";
      temporalConstraints.forEach((tc, index) => {
        mermaidDefinition += `subgraph Temporal_${index} ${tc.predecessorId} --> ${tc.successorId} [Delay: ${tc.minDelayMs}-${tc.maxDelayMs}ms];\n`;
      });
    }

    // In a real implementation, this would call a library like mermaid.render()
    return `<!-- Mermaid Graph Definition Start -->\n${mermaidDefinition}\n<!-- Mermaid Graph Definition End -->`;
  }
}